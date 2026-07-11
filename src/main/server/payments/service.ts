import { Result } from 'better-result'
import { PaymentsDataAccess } from './data-access'
import { ClientsService } from '../clients/service'
import { DatabaseError, type AppError } from '../../lib/errors'
import type { Payment, RecordPaymentInput } from '../../../shared/schemas/payment.schema'
import type { AppDb } from '../../db/client'

/**
 * Payments are entirely independent of orders — recording one is a
 * standalone action against a client's running `debt` balance. Nothing
 * here reads or writes the orders/order_items tables, and there is no
 * `orderId` column on payments anywhere in the schema.
 *
 * No `as unknown as Payment` casts: `PaymentsDataAccess` selects exactly
 * the columns `Payment` needs, so the row it returns already matches.
 */
export class PaymentsService {
  constructor(
    private readonly dataAccess: PaymentsDataAccess,
    private readonly db: AppDb,
    // Cross-service call per the architecture rule: PaymentsService talks
    // to ClientsService rather than reading/writing the clients table
    // directly.
    private readonly clientsService: ClientsService
  ) {}

  async listForClient(clientId: number): Promise<Result<Payment[], AppError>> {
    try {
      const rows = await this.dataAccess.findByClient(clientId)
      return Result.ok(rows)
    } catch (cause) {
      return Result.err(new DatabaseError({ message: 'Failed to list payments', cause }))
    }
  }

  /**
   * The actual atomic unit of work: insert the payment row (at the given
   * timestamp) and decrement the client's `debt` by the same amount.
   * `tx` is a required first argument — callers decide the transaction
   * boundary: `recordPayment` below opens its own for a standalone
   * payment, while `OrdersService.createOrder` passes its own transaction
   * when a deposit is entered alongside a new order, so the order, its
   * stock/debt effects, and this payment all commit or roll back together.
   */
  async recordPaymentAt(
    tx: AppDb,
    input: RecordPaymentInput,
    timestamp: Date
  ): Promise<Result<Payment, AppError>> {
    try {
      const row = await this.dataAccess.create(tx, input, timestamp)

      const debtResult = await this.clientsService.adjustDebt(tx, input.clientId, -input.amount)
      if (debtResult.isErr()) throw debtResult.error

      return Result.ok(row)
    } catch (thrown) {
      if (thrown && typeof thrown === 'object' && 'tag' in thrown) {
        return Result.err(thrown as unknown as AppError)
      }
      return Result.err(new DatabaseError({ message: 'Failed to record payment', cause: thrown }))
    }
  }

  /**
   * Public entry point for a standalone payment (e.g. the client walks in
   * and pays down their tab, unrelated to any specific order). Validates
   * the client exists, then opens its own transaction around
   * `recordPaymentAt` with the current time.
   */
  async recordPayment(input: RecordPaymentInput): Promise<Result<Payment, AppError>> {
    const clientResult = await this.clientsService.getById(input.clientId)
    if (clientResult.isErr()) return Result.err(clientResult.error)

    try {
      const payment = await this.db.transaction(async (tx) => {
        const appTx = tx as unknown as AppDb
        const result = await this.recordPaymentAt(appTx, input, new Date())
        if (result.isErr()) throw result.error
        return result.value
      })
      return Result.ok(payment)
    } catch (thrown) {
      if (thrown && typeof thrown === 'object' && 'tag' in thrown) {
        return Result.err(thrown as unknown as AppError)
      }
      return Result.err(new DatabaseError({ message: 'Failed to record payment', cause: thrown }))
    }
  }

  /**
   * Looks up how much was deposited at the exact moment an order was
   * created — by matching timestamps, since payments carry no `orderId`.
   * Sums in application code rather than with SQL `SUM()`: this is a
   * tiny, already-filtered result set (in practice 0 or 1 rows, since
   * only one deposit is ever recorded per order-creation moment), not a
   * table-wide aggregation, so there's no query-cost reason to push the
   * sum into SQL.
   */
  async getDepositAtTimestamp(
    clientId: number,
    timestamp: Date
  ): Promise<Result<number, AppError>> {
    try {
      console.log({ clientId, timestamp })

      const rows = await this.dataAccess.findByClientAtTimestamp(clientId, timestamp)
      const total = rows.reduce((sum, row) => sum + row.amount, 0)
      return Result.ok(total)
    } catch (cause) {
      return Result.err(new DatabaseError({ message: 'Failed to look up deposit', cause }))
    }
  }
}
