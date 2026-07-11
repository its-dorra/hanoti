import { migrate } from 'drizzle-orm/libsql/migrator'
import { createDb } from './client'

/**
 * Dev-only migration runner (`npm run db:migrate`). Applies whatever's in
 * ./drizzle (generated via `npm run db:generate`) to ./dev.db.
 *
 * The packaged Electron app runs the same `migrate()` call against the
 * real userData db path on startup — wire that into electron/main.ts
 * once you've generated your first migration, e.g.:
 *
 *   import { migrate } from "drizzle-orm/libsql/migrator";
 *   migrate(db, { migrationsFolder: path.join(process.resourcesPath, "drizzle") });
 *
 * (Left out of main.ts by default since there are no generated migrations
 * yet in this scaffold — run `db:generate` first.)
 */
const db = createDb('./dev.db')
migrate(db, { migrationsFolder: './drizzle' })
console.log('Migrations applied to ./dev.db')
