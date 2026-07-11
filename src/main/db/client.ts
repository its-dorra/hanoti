import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import * as schema from './schema'
import path from 'node:path'

/**
 * Resolves the SQLite file location.
 *
 * In Electron this MUST live under `app.getPath("userData")`, never inside
 * the packaged app directory (which is read-only once installed, and would
 * be wiped on reinstall/update). We accept the path as a parameter so this
 * module has no direct Electron dependency and stays testable outside it.
 */
export function createDb(dbFilePath: string) {
  const sqlite = createClient({ url: `file:${dbFilePath}` })
  return drizzle(sqlite, { schema })
}

export type AppDb = ReturnType<typeof createDb>

// Convenience default export path helper used by electron/main.ts
export function defaultDbPath(userDataDir: string) {
  return path.join(userDataDir, 'grocery-store.db')
}
