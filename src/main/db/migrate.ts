import { migrate } from 'drizzle-orm/libsql/migrator'
import { createDb } from './client'

export async function runMigrations(db: ReturnType<typeof createDb>, migrationPath: string) {
  await migrate(db, { migrationsFolder: migrationPath })
  console.log(`✅ Migrations applied from ${migrationPath}`)
}
