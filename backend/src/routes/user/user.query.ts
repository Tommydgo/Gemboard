import pool, { RowDataPacket, ResultSetHeader } from '../../config/db'
import bcrypt from 'bcryptjs'

interface User extends RowDataPacket {
    id: number;
    email: string;
    password: string;
    created_at: Date | string;
    firstname: string;
    name: string;
}

interface Todo extends RowDataPacket {
    id: number;
    title: string;
    description: string;
    created_at: Date | string;
    due_time: Date | string;
    status: 'todo' | 'in progress' | 'done';
    user_id: number;
}

async function email_taken(email : string)
{
    const [rows] = await pool.execute<User[]>(
        'SELECT * FROM user WHERE email = ?',
        [email])

    if (rows.length > 0)
        return true;
    return false;
}

async function user_infos_mail(mail : string)
{
    const [rows] = await pool.execute<User[]>(
        'SELECT id, email, password, created_at, firstname, name FROM user WHERE email = ?',
        [mail])
    if (rows.length === 0)
        return null;
    return rows[0]
}

async function user_infos(id : number)
{
    const [rows] = await pool.execute<User[]>(
        'SELECT id, email, password, created_at, firstname, name FROM user WHERE id = ?',
        [id])
    if (rows.length === 0)
        return null;
    return rows[0]
}

async function user_todos(id : number)
{
    const [rows] = await pool.execute<Todo[]>(
        'SELECT * FROM todo WHERE user_id = ?',
        [id])
    return rows
}

async function create_user(email : string, password : string, name : string, firstname : string)
{
    const [result] = await pool.execute<ResultSetHeader>(
        'INSERT INTO user (email, password, name, firstname) VALUES (?, ?, ?, ?)',
        [email, password, name, firstname])
    return result.insertId
}

async function update_user(id : number, email : string, password : string | null, name : string, firstname : string)
{
    if (password === null) {
        const [result] = await pool.execute<ResultSetHeader>(
            'UPDATE user SET email = ?, name = ?, firstname = ? WHERE id = ?',
            [email, name, firstname, id])
        return result.affectedRows
    }
    const [result] = await pool.execute<ResultSetHeader>(
            'UPDATE user SET email = ?, password = ?, name = ?, firstname = ? WHERE id = ?',
            [email, password, name, firstname, id])
    return result.affectedRows
}

async function delete_user(id : number)
{
    const [result] = await pool.execute<ResultSetHeader>(
        'DELETE FROM user WHERE id = ?',
        [id])
    return result.affectedRows
}

async function check_pw(email : string, password : string)
{
    const [rows] = await pool.execute<User[]>(
        'SELECT id, password FROM user WHERE email = ?',
        [email])

    if (rows.length === 0)
        return false
    if (await bcrypt.compare(password, rows[0].password))
        return rows[0].id;
    return false
}

export { email_taken, create_user, check_pw, user_infos, user_todos, user_infos_mail, delete_user, update_user };
