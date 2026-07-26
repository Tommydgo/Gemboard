import pool, { RowDataPacket, ResultSetHeader } from '../../config/db'

interface Board extends RowDataPacket {
    id: number;
    name: string;
    created_at: Date | string;
    user_id: number;
}

async function all_board_infos(user_id : number)
{
    const [rows] = await pool.execute<Board[]>(
        'SELECT id, title AS name, created_at, user_id FROM board WHERE user_id = ?',
        [user_id])
    return rows
}

async function board_infos(id : number, user_id : number)
{
    const [rows] = await pool.execute<Board[]>(
        'SELECT id, title AS name, created_at, user_id FROM board WHERE id = ? AND user_id = ?',
        [id, user_id])
    if (rows.length === 0)
        return null;
    return rows[0]
}

async function create_board(title : string, user_id : number)
{
    const [result] = await pool.execute<ResultSetHeader>(
        'INSERT INTO board (title, user_id) VALUES (?, ?)',
        [title, user_id])
    return result.insertId
}

async function update_board(title : string, id : number, user_id : number)
{
    const [result] = await pool.execute<ResultSetHeader>(
        'UPDATE board SET title = ? WHERE id = ? AND user_id = ?',
        [title, id, user_id])
    return result.affectedRows
}

async function delete_board(id : number, user_id : number)
{
    const [result] = await pool.execute<ResultSetHeader>(
        'DELETE FROM board WHERE id = ? AND user_id = ?',
        [id, user_id])
    return result.affectedRows
}

export { all_board_infos, board_infos, create_board, update_board, delete_board };
