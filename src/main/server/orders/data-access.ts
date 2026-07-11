import { and, desc, eq, gte, lte, sql } from 'drizzle-orm'
import type { AppDb } from '../../db/client'
import { orders, orderItems } from '../../db/schema'
import type { OrderFilterInput } from '../../shared/schemas/order.schema'

export interface NewOrderItemRow {
  productId: number
  productNameSnapshot: string
  quantity: number
  unitPrice: number
  lineTotal: number
}

// Explicit column lists so every returned row's shape matches
// `Order`/`OrderItem` exactly — no hidden columns to strip, but naming
// them keeps this locked in even if the table grows internal-only columns
// later, and means the service layer needs no cast.
const ORDER_COLUMNS = {
  id: orders.id,
  invoiceNumber: orders.invoiceNumber,
  clientId: orders.clientId,
  orderDate: orders.orderDate,
  status: orders.status,
  subtotal: orders.subtotal,
  createdAt: orders.createdAt,
  updatedAt: orders.updatedAt
}

const ORDER_ITEM_COLUMNS = {
  id: orderItems.id,
  orderId: orderItems.orderId,
  productId: orderItems.productId,
  productNameSnapshot: orderItems.productNameSnapshot,
  quantity: orderItems.quantity,
  unitPrice: orderItems.unitPrice,
  lineTotal: orderItems.lineTotal
}

export class OrdersDataAccess {
  constructor(private readonly db: AppDb) {}

  async findAll(filter: OrderFilterInput) {
    return this.db
      .select(ORDER_COLUMNS)
      .from(orders)
      .where(
        and(
          filter.clientId ? eq(orders.clientId, filter.clientId) : undefined,
          filter.status ? eq(orders.status, filter.status) : undefined,
          filter.dateFrom ? gte(orders.orderDate, filter.dateFrom) : undefined,
          filter.dateTo ? lte(orders.orderDate, filter.dateTo) : undefined
        )
      )
      .orderBy(desc(orders.orderDate))
  }

  async findByIdWithItems(id: number) {
    const [order] = await this.db.select(ORDER_COLUMNS).from(orders).where(eq(orders.id, id))
    if (!order) return null
    const items = await this.db
      .select(ORDER_ITEM_COLUMNS)
      .from(orderItems)
      .where(eq(orderItems.orderId, id))
    return { ...order, items }
  }

  /** Next sequential invoice number, computed inside the given transaction. */
  async getNextInvoiceNumber(tx: AppDb): Promise<number> {
    const [row] = await tx
      .select({ max: sql<number>`coalesce(max(${orders.invoiceNumber}), 0)` })
      .from(orders)
    return (row?.max ?? 0) + 1
  }

  /**
   * `timestamp` is written explicitly to both `orderDate` and `createdAt`
   * (instead of leaning on the column defaults) so that when a deposit
   * accompanies this order, OrdersService can hand the exact same `Date`
   * value to the payment insert — giving the two rows an identical,
   * exactly-matchable timestamp for later correlation (see
   * PaymentsDataAccess.findByClientAtTimestamp), with no FK between them.
   */
  async insertOrder(
    tx: AppDb,
    data: {
      invoiceNumber: number
      clientId: number
      subtotal: number
      timestamp: Date
    }
  ) {
    const [row] = await tx
      .insert(orders)
      .values({
        invoiceNumber: data.invoiceNumber,
        clientId: data.clientId,
        subtotal: data.subtotal,
        orderDate: data.timestamp,
        createdAt: data.timestamp,
        updatedAt: data.timestamp
      })
      .returning(ORDER_COLUMNS)
    return row
  }

  async insertOrderItems(tx: AppDb, orderId: number, items: NewOrderItemRow[]) {
    return tx
      .insert(orderItems)
      .values(items.map((item) => ({ orderId, ...item })))
      .returning(ORDER_ITEM_COLUMNS)
  }

  async updateStatus(tx: AppDb, id: number, status: 'open' | 'cancelled') {
    const [row] = await tx
      .update(orders)
      .set({ status, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning(ORDER_COLUMNS)
    return row ?? null
  }

  async replaceItems(tx: AppDb, orderId: number, items: NewOrderItemRow[], newSubtotal: number) {
    await tx.delete(orderItems).where(eq(orderItems.orderId, orderId))
    await tx.insert(orderItems).values(items.map((item) => ({ orderId, ...item })))
    const [row] = await tx
      .update(orders)
      .set({ subtotal: newSubtotal, updatedAt: new Date() })
      .where(eq(orders.id, orderId))
      .returning(ORDER_COLUMNS)
    return row
  }
}
