import { Result } from 'better-result'
import { PaymentsDataAccess } from './data-access'
import { ClientsService } from '../clients/service'
import { DatabaseError, PaymentNotFoundError, type AppError } from '../../lib/errors'
import type { Payment, RecordPaymentInput } from '../../../shared/schemas/payment.schema'
import type { AppDb, AppTransaction } from '../../db/client'
import { ClientLedgersService } from '../ledgers/service'

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
    private readonly clientsService: ClientsService,
    private readonly ledgersService: ClientLedgersService
  ) {}

  // async listForClient(clientId: number): Promise<Result<Payment[], AppError>> {
  //   try {
  //     const rows = await this.dataAccess.findByClient(clientId)
  //     return Result.ok(rows)
  //   } catch (cause) {
  //     return Result.err(new DatabaseError({ message: 'Failed to list payments', cause }))
  //   }
  // }

  async recordPaymentAt(
    tx: AppTransaction,
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
        const result = await this.recordPaymentAt(tx, input, new Date())
        if (result.isErr()) throw result.error

        // create a ledger entry for the payment, reflecting the new balance after the deposit
        const ledgerResult = await this.ledgersService.createLedgerEntry(tx, {
          clientId: input.clientId,
          referenceId: result.value.id,
          referenceType: 'payment',
          amount: input.amount,
          balanceBefore: clientResult.value.balance,
          balanceAfter: clientResult.value.balance - input.amount
        })

        if (ledgerResult.isErr()) throw ledgerResult.error

        const debtAdjustmentResult = await this.clientsService.adjustDebt(
          tx,
          input.clientId,
          -input.amount
        )
        if (debtAdjustmentResult.isErr()) throw debtAdjustmentResult.error

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

  async deletePayment(tx: AppTransaction, paymentId: number): Promise<Result<Payment, AppError>> {
    const existingPayment = await this.dataAccess.getById(paymentId)
    if (!existingPayment) return Result.err(new PaymentNotFoundError({ paymentId }))

    try {
      await this.dataAccess.delete(tx, paymentId)
      const debtResult = await this.clientsService.adjustDebt(
        tx,
        existingPayment.clientId,
        existingPayment.amount
      )
      if (debtResult.isErr()) throw debtResult.error

      return Result.ok(existingPayment)
    } catch (thrown) {
      if (thrown && typeof thrown === 'object' && 'tag' in thrown) {
        return Result.err(thrown as unknown as AppError)
      }
      return Result.err(new DatabaseError({ message: 'Failed to delete payment', cause: thrown }))
    }
  }
}
