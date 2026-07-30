import { AppDb, AppTransaction } from '../../db/client'
import { clientLedgers } from '../../db/schema'
import { and, desc, eq, lt, lte, or } from 'drizzle-orm'
import { endOfDay } from '../../lib/utils'

export class LedgersDataAccess {
  constructor(private readonly db: AppDb) {}

  async findAll(
    clientId: number,
    type: (typeof clientLedgers.$inferSelect)['referenceType'] | 'all',
    limit?: number | null,
    cursor?: { createdAt: Date; id: number },
    before?: Date
  ) {
    const queryLimit = limit ?? 20

    return this.db
      .select()
      .from(clientLedgers)
      .where(
        and(
          before ? lte(clientLedgers.createdAt, endOfDay(before)) : undefined,
          type !== 'all' ? eq(clientLedgers.referenceType, type) : undefined,
          eq(clientLedgers.clientId, clientId),
          cursor
            ? or(
                lt(clientLedgers.createdAt, cursor.createdAt),
                and(eq(clientLedgers.createdAt, cursor.createdAt), lt(clientLedgers.id, cursor.id))
              )
            : undefined
        )
      )
      .orderBy(desc(clientLedgers.createdAt), desc(clientLedgers.id))
      .limit(queryLimit + 1)
  }

  async createLedgerEntry(
    tx: AppTransaction,
    data: {
      clientId: number
      referenceId: number
      referenceType: (typeof clientLedgers.$inferSelect)['referenceType']
      amount: number
      balanceBefore: number
      balanceAfter: number
    }
  ) {
    return tx.insert(clientLedgers).values(data)
  }

  async getLastLedger() {
    const [lastLedger] = await this.db
      .select()
      .from(clientLedgers)
      .orderBy(desc(clientLedgers.createdAt))
      .limit(1)

    if (!lastLedger) return null

    return lastLedger
  }

  async deleteLastLedgerEntry(tx: AppTransaction) {
    const lastLedger = await this.getLastLedger()

    if (!lastLedger) return null

    await tx.delete(clientLedgers).where(eq(clientLedgers.id, lastLedger.id))

    return lastLedger
  }
}
