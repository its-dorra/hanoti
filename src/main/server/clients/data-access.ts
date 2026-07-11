import { eq, like, sql } from 'drizzle-orm'
import type { AppDb } from '../../db/client'
import { clients } from '../../db/schema'
import type { CreateClientInput, UpdateClientInput } from '../../../shared/schemas/client.schema'

/**
 * Data-access layer for clients. Database operations only — no business
 * rules, no validation beyond what SQL/Drizzle enforces structurally.
 *
 * No soft-delete flag on this table — `delete` below is a real SQL
 * DELETE. Every select/returning here still names its columns explicitly
 * rather than using `.select()`/`.returning()` with no arguments, so the
 * returned row's shape matches the `Client` type precisely and services
 * can return it directly without an `as unknown as Client` cast.
 *
 * Deliberately has NO sum()/count() aggregation queries. The client's
 * `debt` is a plain column on the row, kept correct incrementally by
 * whoever changes it (OrdersService on order creation, PaymentsService on
 * payment) via `adjustDebt`, rather than recomputed from orders/payments
 * on every read.
 */

const CLIENT_COLUMNS = {
  id: clients.id,
  name: clients.name,
  phone: clients.phone,
  address: clients.address,
  notes: clients.notes,
  debt: clients.debt,
  createdAt: clients.createdAt,
  updatedAt: clients.updatedAt
}

export class ClientsDataAccess {
  constructor(private readonly db: AppDb) {}

  async findAll(query: string) {
    return this.db
      .select(CLIENT_COLUMNS)
      .from(clients)
      .where(query ? like(clients.name, `%${query}%`) : undefined)
      .orderBy(clients.name)
  }

  async findById(id: number) {
    const [row] = await this.db.select(CLIENT_COLUMNS).from(clients).where(eq(clients.id, id))
    return row ?? null
  }

  async create(input: CreateClientInput) {
    const [row] = await this.db
      .insert(clients)
      .values({
        name: input.name,
        phone: input.phone ?? null,
        address: input.address ?? null,
        notes: input.notes ?? null
      })
      .returning(CLIENT_COLUMNS)
    return row
  }

  async update(input: UpdateClientInput) {
    const { id, ...rest } = input
    const [row] = await this.db
      .update(clients)
      .set({ ...rest, updatedAt: new Date() })
      .where(eq(clients.id, id))
      .returning(CLIENT_COLUMNS)
    return row ?? null
  }

  /**
   * Hard delete — no soft-delete flag anywhere in this schema. If the
   * client has existing orders or payments, the `references(() =>
   * clients.id)` foreign keys on those tables (no `onDelete` cascade
   * configured) will reject this at the SQLite level rather than
   * silently orphaning or cascading away their order/payment history.
   */
  async delete(id: number) {
    const [row] = await this.db.delete(clients).where(eq(clients.id, id)).returning(CLIENT_COLUMNS)
    return row ?? null
  }

  /**
   * Adjusts the client's running debt balance by `delta` in a single
   * UPDATE (no read-then-write round trip needed since SQL can do
   * `debt = debt + delta` directly, and no aggregation over other tables).
   *
   * `tx` is a required first argument — this method only ever runs as one
   * step of a larger atomic operation (an order being created/edited, or
   * a payment being recorded), never as a standalone write.
   */
  async adjustDebt(tx: AppDb, clientId: number, delta: number) {
    const [row] = await tx
      .update(clients)
      .set({ debt: sql`${clients.debt} + ${delta}`, updatedAt: new Date() })
      .where(eq(clients.id, clientId))
      .returning(CLIENT_COLUMNS)
    return row ?? null
  }
}
