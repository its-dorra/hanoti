import { and, eq, desc } from 'drizzle-orm'
import type { AppDb } from '../../db/client'
import { payments } from '../../db/schema'
import type { RecordPaymentInput } from '../../../shared/schemas/payment.schema'

// Explicit column list — this table has no internal-only columns to hide
// today, but naming them keeps the returned shape locked to exactly what
// `Payment` needs regardless of future schema additions.
const PAYMENT_COLUMNS = {
  id: payments.id,
  clientId: payments.clientId,
  amount: payments.amount,
  paymentDate: payments.paymentDate,
  note: payments.note,
  createdAt: payments.createdAt
}

export class PaymentsDataAccess {
  constructor(private readonly db: AppDb) {}

  async findByClient(clientId: number) {
    return this.db
      .select(PAYMENT_COLUMNS)
      .from(payments)
      .where(eq(payments.clientId, clientId))
      .orderBy(desc(payments.paymentDate))
  }

  /**
   * Payments and orders share no foreign key at all (see schema.ts) — a
   * payment made "at order creation time" is correlated purely by having
   * been written with the exact same `timestamp` value the order was
   * written with, in the same transaction. This looks it up that way:
   * exact equality on `paymentDate`, not a range or a stored relation.
   * Used by the invoice PDF to show what was deposited when an order was
   * created, without the schema ever coupling the two tables.
   */
  async findByClientAtTimestamp(clientId: number, timestamp: Date) {
    return this.db
      .select(PAYMENT_COLUMNS)
      .from(payments)
      .where(and(eq(payments.clientId, clientId), eq(payments.paymentDate, timestamp)))
  }

  /**
   * Records a standalone payment against a client's balance, with an
   * explicit `timestamp` rather than letting the column default apply.
   * `tx` is a required first argument since this write always happens as
   * one step of a larger atomic transaction (PaymentsService.recordPayment,
   * or OrdersService.createOrder when a deposit accompanies the order).
   */
  async create(tx: AppDb, input: RecordPaymentInput, timestamp: Date) {
    const [row] = await tx
      .insert(payments)
      .values({
        clientId: input.clientId,
        amount: input.amount,
        note: input.note ?? null,
        paymentDate: timestamp,
        createdAt: timestamp
      })
      .returning(PAYMENT_COLUMNS)
    return row
  }
}
