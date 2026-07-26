import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import * as schema from './schema'

export function createDb(dbFilePath: string) {
  const sqlite = createClient({ url: `file:${dbFilePath}` })

  return drizzle(sqlite, { schema })
}

export type AppDb = ReturnType<typeof createDb>
export type AppTransaction = Parameters<Parameters<AppDb['transaction']>[0]>[0]
