import { Result } from 'better-result'
import { clientLedgers } from '../../db/schema'
import { LedgersDataAccess } from './data-access'
import { AppError, DatabaseError } from '../../lib/errors'
import { AppDb, AppTransaction } from '../../db/client'
import { OrdersService } from '../orders/service'
import { PaymentsService } from '../payments/service'
import { ClientsService } from '../clients/service'

export class ClientLedgersService {
  ordersService!: OrdersService
  paymentsService!: PaymentsService
  clientsService!: ClientsService

  setDependencies(
    ordersService: OrdersService,
    paymentsService: PaymentsService,
    clientsService: ClientsService
  ) {
    this.ordersService = ordersService
    this.paymentsService = paymentsService
    this.clientsService = clientsService
  }

  constructor(
    private readonly db: AppDb,
    private readonly dataAccess: LedgersDataAccess
  ) {}

  async findAll(
    clientId: number,
    type: (typeof clientLedgers.$inferSelect)['referenceType'] | 'all',
    limit?: number | null,
    cursor?: { createdAt: Date; id: number },
    before?: Date
  ) {
    try {
      const rows = await this.dataAccess.findAll(clientId, type, limit, cursor, before)
      if (limit !== undefined && limit !== null) {
        const hasNextPage = rows.length > limit
        const items = hasNextPage ? rows.slice(0, limit) : rows
        const nextCursor =
          hasNextPage && items.length > 0
            ? { createdAt: items[items.length - 1].createdAt, id: items[items.length - 1].id }
            : null
        return Result.ok({ items, nextCursor })
      } else {
        return Result.ok({ items: rows, nextCursor: null })
      }
    } catch (cause) {
      return Result.err(new DatabaseError({ message: 'Failed to list clients', cause }))
    }
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
    try {
      const row = await this.dataAccess.createLedgerEntry(tx, data)
      return Result.ok(row)
    } catch (cause) {
      return Result.err(new DatabaseError({ message: 'Failed to create ledger entry', cause }))
    }
  }

  async deleteLastLedgerEntry() {
    try {
      return this.db.transaction(async (tx) => {
        const lastLedger = await this.dataAccess.deleteLastLedgerEntry(tx)

        if (!lastLedger) {
          throw new DatabaseError({ message: 'No ledger entry found to delete' })
        }

        const clientResult = await this.clientsService.getById(lastLedger.clientId)
        if (clientResult.isErr()) throw clientResult.error

        const client = clientResult.value

        const debtAdjustment =
          lastLedger.referenceType === 'order' ? -lastLedger.amount : lastLedger.amount

        const debtResult = await this.clientsService.adjustDebt(tx, client.id, debtAdjustment)
        if (debtResult.isErr()) throw debtResult.error

        switch (lastLedger.referenceType) {
          case 'order': {
            const orderResult = await this.ordersService.deleteOrder(tx, lastLedger.referenceId)
            if (orderResult.isErr()) throw orderResult.error

            return Result.ok(true)
          }

          case 'payment': {
            const paymentResult = await this.paymentsService.deletePayment(
              tx,
              lastLedger.referenceId
            )
            if (paymentResult.isErr()) throw paymentResult.error

            return Result.ok(true)
          }

          default:
            return Result.err(
              new DatabaseError({ message: 'Unknown reference type for last ledger entry' })
            )
        }
      })
    } catch (e) {
      if (e && typeof e === 'object' && 'tag' in e) {
        return Result.err(e as unknown as AppError)
      }
      return Result.err(
        new DatabaseError({ message: 'Failed to delete last ledger entry', cause: e })
      )
    }
  }

  async getResumeBalanceByDate(clientId: number, resumeDate: Date) {
    try {
      const result = await this.dataAccess.getResumeBalanceByDate(clientId, resumeDate)

      return Result.ok(result)
    } catch (e) {
      return Result.err(new DatabaseError({ message: 'Failed to get resume balance', cause: e }))
    }
  }
}
