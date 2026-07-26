import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema'

export function createDb(dbFilePath: string) {
  const sqlite = new Database(dbFilePath)
  sqlite.pragma('foreign_keys = ON')
  sqlite.pragma('journal_mode = WAL')
  sqlite.pragma('busy_timeout = 10000')
  sqlite.pragma('synchronous = NORMAL')

  return drizzle(sqlite, { schema })
}

export type AppDb = ReturnType<typeof createDb>
export type AppTransaction = Parameters<Parameters<AppDb['transaction']>[0]>[0]
