import { Result } from 'better-result'
import { OrdersDataAccess, type NewOrderItemRow } from './data-access'
import { ClientsService } from '../clients/service'
import { ProductsService } from '../products/service'
import { PaymentsService } from '../payments/service'
import type { AppDb } from '../../db/client'
import {
  EmptyOrderError,
  InvalidPriceForProductError,
  OrderNotFoundError,
  DatabaseError,
  type AppError
} from '../../lib/errors'
import type {
  CreateOrderInput,
  UpdateOrderInput,
  OrderFilterInput,
  Order
} from '../../../shared/schemas/order.schema'

interface ResolvedItem extends NewOrderItemRow {
  quantity: number
}

/**
 * Orders are NOT responsible for payment in the schema sense — there is
 * no payment field on the order row and no `orderId` on payments. But the
 * cashier can still enter a deposit *while* creating an order, as a
 * convenience: that deposit is written as a genuinely separate Payment
 * row, in the same transaction, correlated with the order purely by
 * sharing one exact timestamp (no FK). No `as unknown as Order` casts:
 * `OrdersDataAccess` selects exactly the columns `Order`/`OrderItem` need.
 */
export class OrdersService {
  constructor(
    private readonly dataAccess: OrdersDataAccess,
    private readonly db: AppDb,
    private readonly clientsService: ClientsService,
    private readonly productsService: ProductsService,
    private readonly paymentsService: PaymentsService
  ) {}

  async list(filter: OrderFilterInput): Promise<Result<Order[], AppError>> {
    try {
      const rows = await this.dataAccess.findAll(filter)
      return Result.ok(rows.map((row) => ({ ...row, items: [] })))
    } catch (cause) {
      return Result.err(new DatabaseError({ message: 'Failed to list orders', cause }))
    }
  }

  async getById(id: number): Promise<Result<Order, AppError>> {
    try {
      const row = await this.dataAccess.findByIdWithItems(id)
      if (!row) return Result.err(new OrderNotFoundError({ orderId: id }))
      return Result.ok(row)
    } catch (cause) {
      return Result.err(new DatabaseError({ message: 'Failed to fetch order', cause }))
    }
  }

  /**
   * Resolves each requested line into a concrete snapshot: product name,
   * unit price (from a predefined amount or a custom one), and line
   * total. Pure validation/computation — no writes happen here.
   */
  private async resolveItems(
    items: CreateOrderInput['items']
  ): Promise<Result<ResolvedItem[], AppError>> {
    const resolved: ResolvedItem[] = []

    for (const item of items) {
      const productResult = await this.productsService.getById(item.productId)
      if (productResult.isErr()) return Result.err(productResult.error)
      const product = productResult.value

      let unitPrice: number

      if (item.priceId !== undefined) {
        const price = await this.productsService.findPriceById(item.priceId)
        if (!price || price.productId !== item.productId) {
          return Result.err(
            new InvalidPriceForProductError({ productId: item.productId, priceId: item.priceId })
          )
        }
        unitPrice = price.amount
      } else {
        // customUnitPrice — guaranteed present by CreateOrderSchema's refine()
        unitPrice = item.customUnitPrice!
      }

      resolved.push({
        productId: item.productId,
        productNameSnapshot: product.name,
        quantity: item.quantity,
        unitPrice,
        lineTotal: unitPrice * item.quantity
      })
    }

    return Result.ok(resolved)
  }

  /**
   * Creates an order end-to-end: validates the client and every line item,
   * snapshots product names/prices onto the order (so later edits or
   * deletions to the product never alter a printed invoice), decrements
   * stock (floored at 0, never negative — an order exceeding stock is
   * still allowed to save), increases the client's `debt` by the order
   * subtotal, and — if a deposit was entered — records it as a separate
   * Payment row sharing this order's exact creation timestamp.
   *
   * All writes happen in a single DB transaction: if any step fails,
   * nothing is committed.
   */
  async createOrder(input: CreateOrderInput): Promise<Result<Order, AppError>> {
    if (input.items.length === 0) return Result.err(new EmptyOrderError({}))

    const clientResult = await this.clientsService.getById(input.clientId)
    if (clientResult.isErr()) return Result.err(clientResult.error)

    const resolvedResult = await this.resolveItems(input.items)
    if (resolvedResult.isErr()) return Result.err(resolvedResult.error)
    const resolvedItems = resolvedResult.value

    const subtotal = resolvedItems.reduce((sum, i) => sum + i.lineTotal, 0)
    // Shared by the order row and, if a deposit is entered, the payment
    // row — this exact equality is how the invoice PDF later finds "the
    // deposit made when this order was created" without any FK.
    const timestamp = new Date()

    try {
      const order = await this.db.transaction(async (tx) => {
        const appTx = tx as unknown as AppDb

        const invoiceNumber = await this.dataAccess.getNextInvoiceNumber(appTx)

        const orderRow = await this.dataAccess.insertOrder(appTx, {
          invoiceNumber,
          clientId: input.clientId,
          subtotal,
          timestamp
        })

        const itemRows = await this.dataAccess.insertOrderItems(appTx, orderRow.id, resolvedItems)

        for (const item of resolvedItems) {
          const stockResult = await this.productsService.reserveStockForOrder(
            appTx,
            item.productId,
            item.quantity
          )
          if (stockResult.isErr()) throw stockResult.error
        }

        // The client now owes `subtotal` more — a single incremental
        // UPDATE, not a recomputation over every order/payment.
        const debtResult = await this.clientsService.adjustDebt(appTx, input.clientId, subtotal)
        if (debtResult.isErr()) throw debtResult.error

        if (input.depositAmount > 0) {
          const paymentResult = await this.paymentsService.recordPaymentAt(
            appTx,
            { clientId: input.clientId, amount: input.depositAmount, method: 'cash', note: null },
            timestamp
          )
          if (paymentResult.isErr()) throw paymentResult.error
        }

        return { ...orderRow, items: itemRows }
      })

      return Result.ok(order)
    } catch (thrown) {
      // Errors thrown from inside the transaction (e.g. stockResult.isErr())
      // are already AppError instances — surface them as-is; anything else
      // is an unexpected DB failure.
      if (thrown && typeof thrown === 'object' && 'tag' in thrown) {
        return Result.err(thrown as unknown as AppError)
      }
      return Result.err(new DatabaseError({ message: 'Failed to create order', cause: thrown }))
    }
  }

  /**
   * Full item replacement for an existing order. Restores stock for the
   * old line items, resolves + reserves stock for the new ones, adjusts
   * the client's debt by the difference between old and new subtotal, and
   * recomputes the subtotal — all inside one transaction. Never touches
   * payments (a deposit is only ever entered at creation time).
   */
  async updateOrder(input: UpdateOrderInput): Promise<Result<Order, AppError>> {
    const existingResult = await this.getById(input.id)
    if (existingResult.isErr()) return Result.err(existingResult.error)
    const existing = existingResult.value

    if (input.status && !input.items) {
      try {
        const row = await this.db.transaction(async (tx) => {
          return this.dataAccess.updateStatus(tx as unknown as AppDb, input.id, input.status!)
        })
        if (!row) return Result.err(new OrderNotFoundError({ orderId: input.id }))
        return this.getById(input.id)
      } catch (cause) {
        return Result.err(new DatabaseError({ message: 'Failed to update order status', cause }))
      }
    }

    if (!input.items) return Result.ok(existing)

    const resolvedResult = await this.resolveItems(input.items)
    if (resolvedResult.isErr()) return Result.err(resolvedResult.error)
    const resolvedItems = resolvedResult.value
    const newSubtotal = resolvedItems.reduce((sum, i) => sum + i.lineTotal, 0)
    const subtotalDelta = newSubtotal - existing.subtotal

    try {
      const order = await this.db.transaction(async (tx) => {
        const appTx = tx as unknown as AppDb

        // Give back stock consumed by the old items...
        for (const oldItem of existing.items) {
          const restoreResult = await this.productsService.reserveStockForOrder(
            appTx,
            oldItem.productId,
            -oldItem.quantity // negative delta = restore
          )
          if (restoreResult.isErr()) throw restoreResult.error
        }

        // ...then reserve stock for the new items.
        for (const newItem of resolvedItems) {
          const reserveResult = await this.productsService.reserveStockForOrder(
            appTx,
            newItem.productId,
            newItem.quantity
          )
          if (reserveResult.isErr()) throw reserveResult.error
        }

        const updated = await this.dataAccess.replaceItems(
          appTx,
          input.id,
          resolvedItems,
          newSubtotal
        )

        if (subtotalDelta !== 0) {
          const debtResult = await this.clientsService.adjustDebt(
            appTx,
            existing.clientId,
            subtotalDelta
          )
          if (debtResult.isErr()) throw debtResult.error
        }

        if (input.status) {
          await this.dataAccess.updateStatus(appTx, input.id, input.status)
        }

        return updated
      })

      return this.getById(order.id)
    } catch (thrown) {
      if (thrown && typeof thrown === 'object' && 'tag' in thrown) {
        return Result.err(thrown as unknown as AppError)
      }
      return Result.err(new DatabaseError({ message: 'Failed to update order', cause: thrown }))
    }
  }
}
