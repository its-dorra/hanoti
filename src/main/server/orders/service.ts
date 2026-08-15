import { Result } from 'better-result'
import { OrdersDataAccess, type NewOrderItemRow } from './data-access'
import { ClientsService } from '../clients/service'
import { ProductsService } from '../products/service'
import { PaymentsService } from '../payments/service'
import type { AppDb, AppTransaction } from '../../db/client'
import {
  EmptyOrderError,
  InvalidPriceForProductError,
  OrderNotFoundError,
  DatabaseError,
  type AppError
} from '../../lib/errors'
import type {
  CreateOrderInput,
  Order,
  OrderFilterInput,
  PaginatedOrders,
  UpdateOrderInput
} from '../../../shared/schemas/order.schema'
import { ClientLedgersService } from '../ledgers/service'

interface ResolvedItem extends NewOrderItemRow {
  quantity: number
}

export class OrdersService {
  constructor(
    private readonly dataAccess: OrdersDataAccess,
    private readonly db: AppDb,
    private readonly clientsService: ClientsService,
    private readonly productsService: ProductsService,
    private readonly paymentsService: PaymentsService,
    private readonly ledgersService: ClientLedgersService
  ) {}

  async list(filter: OrderFilterInput): Promise<Result<PaginatedOrders, AppError>> {
    try {
      const limit = filter.limit ?? 20
      const rows = await this.dataAccess.findAll(filter)
      const hasNextPage = rows.length > limit
      const rawItems = hasNextPage ? rows.slice(0, limit) : rows
      const items = rawItems.map((row) => ({ ...row, items: [] }))

      const nextCursor =
        hasNextPage && items.length > 0
          ? { orderDate: items[items.length - 1].orderDate, id: items[items.length - 1].id }
          : null

      return Result.ok({ items, nextCursor })
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

  async getByIdWithoutItems(id: number): Promise<Result<Order, AppError>> {
    try {
      const row = await this.dataAccess.findByIdWithoutItems(id)
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
        productNameSnapshot: item.productNameSnapshot?.trim() || product.name,
        quantity: item.quantity,
        unitPrice,
        lineTotal: unitPrice * item.quantity
      })
    }

    return Result.ok(resolved)
  }

  async createOrder(input: CreateOrderInput) {
    if (input.items.length === 0) return Result.err(new EmptyOrderError({}))

    const clientResult = await this.clientsService.getById(input.clientId)
    if (clientResult.isErr()) return Result.err(clientResult.error)

    const resolvedResult = await this.resolveItems(input.items)
    if (resolvedResult.isErr()) return Result.err(resolvedResult.error)
    const resolvedItems = resolvedResult.value

    const subtotal = resolvedItems.reduce((sum, i) => sum + i.lineTotal, 0)

    try {
      const order = await this.db.transaction(async (tx) => {
        const appTx = tx

        const orderRow = await this.dataAccess.insertOrder(appTx, {
          clientId: input.clientId,
          subtotal
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

        // create a ledger entry for the order, reflecting the new debt incurred by the client
        const orderLedgerResult = await this.ledgersService.createLedgerEntry(appTx, {
          clientId: input.clientId,
          referenceId: orderRow.id,
          referenceType: 'order',
          amount: subtotal,
          balanceBefore: clientResult.value.balance,
          balanceAfter: clientResult.value.balance + subtotal
        })
        if (orderLedgerResult.isErr()) throw orderLedgerResult.error

        if (input.depositAmount > 0) {
          const paymentResult = await this.paymentsService.recordPaymentTx(appTx, {
            clientId: input.clientId,
            amount: input.depositAmount,
            note: null
          })
          if (paymentResult.isErr()) throw paymentResult.error

          const paymentLedgerResult = await this.ledgersService.createLedgerEntry(appTx, {
            clientId: input.clientId,
            referenceId: paymentResult.value.id,
            referenceType: 'payment',
            amount: input.depositAmount,
            balanceBefore: clientResult.value.balance + subtotal,
            balanceAfter: clientResult.value.balance + subtotal - input.depositAmount
          })
          if (paymentLedgerResult.isErr()) throw paymentLedgerResult.error
        }

        const debtResult = await this.clientsService.adjustDebt(
          appTx,
          input.clientId,
          subtotal - input.depositAmount
        )
        if (debtResult.isErr()) throw debtResult.error

        return { ...orderRow, items: itemRows }
      })

      return Result.ok(order)
    } catch (thrown) {
      if (thrown && typeof thrown === 'object' && 'tag' in thrown) {
        return Result.err(thrown as unknown as AppError)
      }
      return Result.err(new DatabaseError({ message: 'Failed to create order', cause: thrown }))
    }
  }

  async deleteOrder(tx: AppTransaction, id: number): Promise<Result<true, AppError>> {
    const existingResult = await this.getById(id)
    if (existingResult.isErr()) return Result.err(existingResult.error)
    const existing = existingResult.value

    const resolvedResult = await this.resolveItems(existing.items)
    if (resolvedResult.isErr()) return Result.err(resolvedResult.error)
    const resolvedItems = resolvedResult.value

    try {
      const appTx = tx

      // Give back stock consumed by the old items...
      for (const oldItem of resolvedItems) {
        const restoreResult = await this.productsService.reserveStockForOrder(
          appTx,
          oldItem.productId,
          -oldItem.quantity // negative delta = restore
        )
        if (restoreResult.isErr()) throw restoreResult.error
      }

      await this.dataAccess.deleteOrder(appTx, id)

      return Result.ok(true)
    } catch (thrown) {
      if (thrown && typeof thrown === 'object' && 'tag' in thrown) {
        return Result.err(thrown as unknown as AppError)
      }
      return Result.err(new DatabaseError({ message: 'Failed to delete order', cause: thrown }))
    }
  }

  async updateOrder(input: UpdateOrderInput): Promise<Result<Order, AppError>> {
    if (input.items.length === 0) {
      return Result.err(new EmptyOrderError({}))
    }

    const existingResult = await this.getById(input.id)
    if (existingResult.isErr()) return Result.err(existingResult.error)
    const existingOrder = existingResult.value

    const resolvedResult = await this.resolveItems(input.items)
    if (resolvedResult.isErr()) return Result.err(resolvedResult.error)
    const resolvedItems = resolvedResult.value

    const newSubtotal = resolvedItems.reduce((sum, i) => sum + i.lineTotal, 0)
    const oldSubtotal = existingOrder.subtotal
    const delta = newSubtotal - oldSubtotal

    try {
      const updatedOrder = await this.db.transaction(async (tx) => {
        const appTx = tx

        // 1. Restore stock consumed by the existing order items
        for (const oldItem of existingOrder.items) {
          const restoreResult = await this.productsService.reserveStockForOrder(
            appTx,
            oldItem.productId,
            -oldItem.quantity // restore stock
          )
          if (restoreResult.isErr()) throw restoreResult.error
        }

        // 2. Deduct stock for the new order items
        for (const newItem of resolvedItems) {
          const reserveResult = await this.productsService.reserveStockForOrder(
            appTx,
            newItem.productId,
            newItem.quantity // deduct stock
          )
          if (reserveResult.isErr()) throw reserveResult.error
        }

        // 3. Replace items in order_items and update order subtotal
        await this.dataAccess.replaceItems(appTx, input.id, resolvedItems, newSubtotal)

        // 4. Update the order's ledger entry and cascade the debt difference to all subsequent ledger entries
        const ledgerResult = await this.ledgersService.updateOrderLedgerAndCascade(
          appTx,
          existingOrder.clientId,
          existingOrder.id,
          newSubtotal,
          delta
        )
        if (ledgerResult.isErr()) throw ledgerResult.error

        // 5. Update client's balance if subtotal changed
        if (delta !== 0) {
          const debtResult = await this.clientsService.adjustDebt(
            appTx,
            existingOrder.clientId,
            delta
          )
          if (debtResult.isErr()) throw debtResult.error
        }

        const freshOrder = await this.dataAccess.findByIdWithItems(input.id)
        if (!freshOrder) {
          throw new OrderNotFoundError({ orderId: input.id })
        }
        return freshOrder
      })

      return Result.ok(updatedOrder)
    } catch (thrown) {
      if (thrown && typeof thrown === 'object' && 'tag' in thrown) {
        return Result.err(thrown as unknown as AppError)
      }
      return Result.err(new DatabaseError({ message: 'Failed to update order', cause: thrown }))
    }
  }
}
