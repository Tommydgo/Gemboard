import pool from '../../config/db'
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface List extends RowDataPacket {
    id: number;
    title: string;
    position: number;
    board_id: number;
    created_at: Date | string;
}

async function all_list_infos(board_id: number)
{
    const [rows] = await pool.execute<List[]>(
        'SELECT id, title, position, board_id, created_at FROM list WHERE board_id = ? ORDER BY position ASC',
        [board_id])
    return rows
}

async function list_infos(id : number)
{
    const [rows] = await pool.execute<List[]>(
        'SELECT id, title, position, board_id, created_at FROM list WHERE id = ?',
        [id])
    if (rows.length === 0)
        return null;
    return rows[0]
}

async function create_list(title : string, board_id : number)
{
    const conn = await pool.getConnection()
    try {
        await conn.beginTransaction()
        const [maxRows] = await conn.execute<RowDataPacket[]>(
            'SELECT COALESCE(MAX(position), -1) AS maxPos FROM list WHERE board_id = ? FOR UPDATE',
            [board_id])
        const nextPosition = (maxRows[0].maxPos as number) + 1
        const [result] = await conn.execute<ResultSetHeader>(
            'INSERT INTO list (title, position, board_id) VALUES (?, ?, ?)',
            [title, nextPosition, board_id])
        await conn.commit()
        return result.insertId
    } catch (err) {
        await conn.rollback()
        throw err
    } finally {
        conn.release()
    }
}

async function update_list(title : string, id : number)
{
    const [result] = await pool.execute<ResultSetHeader>(
        'UPDATE list SET title = ? WHERE id = ?',
        [title, id])
    return result.affectedRows
}

async function delete_list(id : number)
{
    const [result] = await pool.execute<ResultSetHeader>(
        'DELETE FROM list WHERE id = ?',
        [id])
    return result.affectedRows
}

async function move_list(id : number, position : number)
{
    const conn = await pool.getConnection()
    try {
        await conn.beginTransaction()
        const [rows] = await conn.execute<List[]>(
            'SELECT board_id, position FROM list WHERE id = ? FOR UPDATE',
            [id])
        if (rows.length === 0) {
            await conn.rollback()
            return 0
        }
        const boardId = rows[0].board_id

        // Splice-and-rewrite: rebuild the board's list order in application code,
        // then renumber every sibling to a dense 0..n-1 range. This is immune to
        // pre-existing position gaps (e.g. left behind by a delete), unlike a
        // range-shift that assumes stored positions are contiguous.
        const [siblingRows] = await conn.execute<List[]>(
            'SELECT id FROM list WHERE board_id = ? ORDER BY position ASC FOR UPDATE',
            [boardId])
        const siblingIds = siblingRows.map(row => row.id).filter(rowId => rowId !== id)
        const index = Math.max(0, Math.min(position, siblingIds.length))
        siblingIds.splice(index, 0, id)

        for (let i = 0; i < siblingIds.length; i++) {
            await conn.execute(
                'UPDATE list SET position = ? WHERE id = ?',
                [i, siblingIds[i]])
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

export { all_list_infos, list_infos, create_list, update_list, delete_list, move_list };
