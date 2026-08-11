import { defineConfig } from 'drizzle-kit'
import path from 'node:path'

export default defineConfig({
  schema: './src/main/db/schema.ts',
  out: './resources/migrations',
  dialect: 'sqlite',
  dbCredentials: {
    url: path.join(process.cwd(), 'dev', 'hanoti.db')
  }
})
