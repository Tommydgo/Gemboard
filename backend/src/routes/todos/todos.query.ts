import pool, { RowDataPacket, ResultSetHeader } from '../../config/db'

interface Todo extends RowDataPacket {
    id: number;
    title: string;
    description: string;
    created_at: Date | string;
    due_time: Date | string;
    status: 'todo' | 'in progress' | 'done';
    user_id: number;
    list_id: number;
    position: number;
}

async function all_todo_infos(board_id : number, user_id: number)
{
    const [rows] = await pool.execute<Todo[]>(
        `SELECT todo.id, todo.title, todo.description, todo.created_at, todo.due_time, todo.status, todo.user_id, todo.list_id, todo.position
         FROM todo
         JOIN list ON todo.list_id = list.id
         JOIN board ON list.board_id = board.id
         WHERE list.board_id = ? AND board.user_id = ?
         ORDER BY todo.position ASC`,
        [board_id, user_id])
    return rows
}

async function todo_infos(id : number, user_id: number)
{
    const [rows] = await pool.execute<Todo[]>(
        `SELECT todo.id, todo.title, todo.description, todo.created_at, todo.due_time, todo.status, todo.user_id, todo.list_id, todo.position
         FROM todo
         JOIN list ON todo.list_id = list.id
         JOIN board ON list.board_id = board.id
         WHERE todo.id = ? AND board.user_id = ?`,
        [id, user_id])
    if (rows.length === 0)
        return null;
    return rows[0]
}

async function create_todo(title : string, description : string, due_time : string, user_id : number, list_id : number)
{
    const conn = await pool.getConnection()
    try {
        await conn.beginTransaction()
        const [maxRows] = await conn.execute<RowDataPacket[]>(
            'SELECT COALESCE(MAX(position), -1) AS maxPos FROM todo WHERE list_id = ? FOR UPDATE',
            [list_id])
        const nextPosition = (maxRows[0].maxPos as number) + 1
        const [result] = await conn.execute<ResultSetHeader>(
            'INSERT INTO todo (title, description, due_time, user_id, list_id, position) VALUES (?, ?, ?, ?, ?, ?)',
            [title, description, due_time, user_id, list_id, nextPosition])
        await conn.commit()
        return result.insertId
    } catch (err) {
        await conn.rollback()
        throw err
    } finally {
        conn.release()
    }
}

async function update_todo(title : string, description : string, status : string, due_time : string, id : number, user_id: number)
{
    const [result] = await pool.execute<ResultSetHeader>(
        `UPDATE todo SET title = ?, description = ?, due_time = ?, status = ?
         WHERE id = ? AND list_id IN (
             SELECT list.id FROM list JOIN board ON list.board_id = board.id WHERE board.user_id = ?
         )`,
        [title, description, due_time, status, id, user_id])
    return result.affectedRows
}

async function delete_todo(id : number, user_id: number)
{
    const [result] = await pool.execute<ResultSetHeader>(
        `DELETE FROM todo
         WHERE id = ? AND list_id IN (
             SELECT list.id FROM list JOIN board ON list.board_id = board.id WHERE board.user_id = ?
         )`,
        [id, user_id])
    return result.affectedRows
}

async function move_todo(id : number, list_id : number, position : number, user_id: number)
{
    const conn = await pool.getConnection()
    try {
        await conn.beginTransaction()
        const [rows] = await conn.execute<Todo[]>(
            `SELECT todo.list_id, todo.position
             FROM todo
             JOIN list ON todo.list_id = list.id
             JOIN board ON list.board_id = board.id
             WHERE todo.id = ? AND board.user_id = ? FOR UPDATE`,
            [id, user_id])
        if (rows.length === 0) {
            await conn.rollback()
            return 0
        }
        const oldListId = rows[0].list_id

        // Validate target list ownership before touching its rows
        const [targetListRows] = await conn.execute<RowDataPacket[]>(
            `SELECT list.id
             FROM list
             JOIN board ON list.board_id = board.id
             WHERE list.id = ? AND board.user_id = ? FOR UPDATE`,
            [list_id, user_id])
        if (targetListRows.length === 0) {
            await conn.rollback()
            return 0
        }

        // Splice-and-rewrite: rebuild the target list's order in application code,
        // then renumber every sibling to a dense 0..n-1 range. This is immune to
        // pre-existing position gaps (e.g. left behind by a delete), unlike a
        // range-shift that assumes stored positions are contiguous.
        const [targetRows] = await conn.execute<Todo[]>(
            'SELECT id FROM todo WHERE list_id = ? ORDER BY position ASC FOR UPDATE',
            [list_id])
        const targetIds = targetRows.map(row => row.id).filter(rowId => rowId !== id)
        const index = Math.max(0, Math.min(position, targetIds.length))
        targetIds.splice(index, 0, id)

        if (oldListId !== list_id) {
            const [oldRows] = await conn.execute<Todo[]>(
                'SELECT id FROM todo WHERE list_id = ? ORDER BY position ASC FOR UPDATE',
                [oldListId])
            const oldIds = oldRows.map(row => row.id).filter(rowId => rowId !== id)
            for (let i = 0; i < oldIds.length; i++) {
                await conn.execute(
                    'UPDATE todo SET position = ? WHERE id = ?',
                    [i, oldIds[i]])
            }
        }
        for (let i = 0; i < targetIds.length; i++) {
            await conn.execute(
                'UPDATE todo SET list_id = ?, position = ? WHERE id = ?',
                [list_id, i, targetIds[i]])
        }
        await conn.commit()
        return 1
    } catch (err) {
        await conn.rollback()
        throw err
    } finally {
        conn.release()
    }
}

export { all_todo_infos, todo_infos, create_todo, update_todo, delete_todo, move_todo };
