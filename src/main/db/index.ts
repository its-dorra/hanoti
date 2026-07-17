import { createDb } from './client'
import { getDBPath } from './path'

export const db = () => createDb(getDBPath())
