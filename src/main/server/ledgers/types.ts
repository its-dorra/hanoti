import { clientLedgers } from '../../db/schema'

export type LedgerEntry = typeof clientLedgers.$inferSelect
