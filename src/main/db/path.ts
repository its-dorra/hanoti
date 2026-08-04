import path from 'node:path'
import { app } from 'electron'

export const DBDirectory = () =>
  app.isPackaged ? path.join(app.getPath('userData'), 'database') : path.join(process.cwd(), 'dev')

export function getDBPath() {
  return !app.isPackaged
    ? path.join(DBDirectory(), 'hanoti.db')
    : path.join(DBDirectory(), 'database.db')
}
