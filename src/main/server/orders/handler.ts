import { os } from '../orpc'
// import { z } from 'zod'
import {
  CreateOrderSchema,
  // UpdateOrderSchema,
  OrderFilterSchema
} from '../../../shared/schemas/order.schema'
// import { generateInvoicePdf } from './invoices/generate-invoice'
import { Result } from 'better-result'

export const ordersRouter = os.router({
  list: os.input(OrderFilterSchema).handler(async ({ input, context }) => {
    const result = await context.services.orders.list(input)
    return result.match({
      ok: (v) => v,
      err: (e) => {
        throw context.toORPCError(e)
      }
    })
  }),

  create: os.input(CreateOrderSchema).handler(async ({ input, context }) => {
    const result = await context.services.orders.createOrder(input)
    return Result.match(result, {
      ok: (v) => v,
      err: (e) => {
        throw context.toORPCError(e)
      }
    })
  })
})
