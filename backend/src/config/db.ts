import path from 'path'
import fs from 'fs'
import Database from 'better-sqlite3'

export interface RowDataPacket {
    [column: string]: any
}

export interface ResultSetHeader {
    insertId: number
    affectedRows: number
}

const DB_PATH = process.env.SQLITE_PATH || path.join(__dirname, '../../data.sqlite')
const SCHEMA_PATH = path.join(__dirname, 'schema.sql')

const db = new Database(DB_PATH)
db.pragma('foreign_keys = ON')
db.exec(fs.readFileSync(SCHEMA_PATH, 'utf-8'))

function stripForUpdate(sql: string) {
    return sql.replace(/\s+FOR UPDATE\s*$/i, '')
}

function runQuery<T>(sql: string, params: any[] = []): [T, unknown[]] {
    const cleanSql = stripForUpdate(sql)
    const isSelect = cleanSql.trim().toUpperCase().startsWith('SELECT')
    const stmt = db.prepare(cleanSql)

    if (isSelect)
        return [stmt.all(params) as T, []]

    const info = stmt.run(params)
    const result: ResultSetHeader = { insertId: Number(info.lastInsertRowid), affectedRows: info.changes }
    return [result as T, []]
}

async function execute<T = any>(sql: string, params: any[] = []) {
    return runQuery<T>(sql, params)
}

let lock: Promise<void> = Promise.resolve()

function getConnection() {
    let release: () => void = () => {}
    const acquired = new Promise<void>(resolve => { release = resolve })
    const wait = lock
    lock = wait.then(() => acquired)

    return wait.then(() => ({
        execute: async <T = any>(sql: string, params: any[] = []) => runQuery<T>(sql, params),
        beginTransaction: async () => { db.exec('BEGIN') },
        commit: async () => { db.exec('COMMIT') },
        rollback: async () => { try { db.exec('ROLLBACK') } catch { } },
        release: () => release()
    }))
}

const pool = { execute, getConnection }

export default pool
