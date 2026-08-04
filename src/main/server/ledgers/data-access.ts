import { AppDb, AppTransaction } from '../../db/client'
import { clientLedgers } from '../../db/schema'
import { and, desc, eq, lt, lte, or } from 'drizzle-orm'
import { endOfDay } from '../../lib/utils'
import { LedgerEntry } from './types'

type PaymentLedgerEntry = Omit<LedgerEntry, 'referenceType'> & { referenceType: 'payment' }

export class LedgersDataAccess {
  constructor(private readonly db: AppDb) {}

  async findAll(
    clientId: number,
    type: (typeof clientLedgers.$inferSelect)['referenceType'] | 'all',
    limit?: number | null,
    cursor?: { createdAt: Date; id: number } | null,
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

  async getResumeBalanceByDate(clientId: number, date: Date) {
    let ledger = await this.db.query.clientLedgers.findFirst({
      where: (clientLedgers, { eq, lte, and }) =>
        and(
          eq(clientLedgers.clientId, clientId),
          lte(clientLedgers.createdAt, endOfDay(date)),
          eq(clientLedgers.referenceType, 'payment')
        ),
      orderBy: (clientLedgers, { desc }) => [desc(clientLedgers.createdAt), desc(clientLedgers.id)]
    })

    if (!ledger) {
      const lastLedger = await this.db.query.clientLedgers.findFirst({
        where: (clientLedgers, { eq, and, lte }) =>
          and(eq(clientLedgers.clientId, clientId), lte(clientLedgers.createdAt, endOfDay(date))),
        orderBy: (clientLedgers, { desc }) => [
          desc(clientLedgers.createdAt),
          desc(clientLedgers.id)
        ]
      })

      if (!lastLedger) {
        const client = await this.db.query.clients.findFirst({
          where: (clients, { eq }) => eq(clients.id, clientId)
        })

        if (!client) {
          throw new Error(`Client with ID ${clientId} not found`)
        }
        ledger = {
          amount: 0,
          balanceBefore: client.balance,
          balanceAfter: client.balance,
          clientId,
          createdAt: date,
          id: 0,
          referenceType: 'payment',
          referenceId: 0
        }
      } else {
        ledger = {
          amount: 0,
          balanceBefore: lastLedger.balanceAfter,
          balanceAfter: lastLedger.balanceAfter,
          clientId,
          createdAt: date,
          id: lastLedger.id,
          referenceType: 'payment',
          referenceId: lastLedger.referenceId
        }
      }
    }

    return ledger as PaymentLedgerEntry
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

  async getLastLedger(clientId: number) {
    const lastLedger = await this.db.query.clientLedgers.findFirst({
      where: (clientLedgers, { eq }) => eq(clientLedgers.clientId, clientId),
      orderBy: (clientLedgers, { desc }) => [desc(clientLedgers.createdAt), desc(clientLedgers.id)]
    })

    if (!lastLedger) return null

    return lastLedger
  }

  async deleteLastLedgerEntry(tx: AppTransaction, clientId: number) {
    const lastLedger = await this.getLastLedger(clientId)

    if (!lastLedger) return null

    await tx.delete(clientLedgers).where(eq(clientLedgers.id, lastLedger.id))

    return lastLedger
  }
}
