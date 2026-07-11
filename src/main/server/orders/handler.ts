import { os } from '../orpc'
import { z } from 'zod'
import {
  CreateOrderSchema,
  UpdateOrderSchema,
  OrderFilterSchema
} from '../../../shared/schemas/order.schema'
import { generateInvoicePdf } from './invoices/generate-invoice'

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

  getById: os.input(z.object({ id: z.number().int() })).handler(async ({ input, context }) => {
    const result = await context.services.orders.getById(input.id)
    return result.match({
      ok: (v) => v,
      err: (e) => {
        throw context.toORPCError(e)
      }
    })
  }),

  create: os.input(CreateOrderSchema).handler(async ({ input, context }) => {
    const result = await context.services.orders.createOrder(input)
    return result.match({
      ok: (v) => v,
      err: (e) => {
        throw context.toORPCError(e)
      }
    })
  }),

  update: os.input(UpdateOrderSchema).handler(async ({ input, context }) => {
    const result = await context.services.orders.updateOrder(input)
    return result.match({
      ok: (v) => v,
      err: (e) => {
        throw context.toORPCError(e)
      }
    })
  }),

  /**
   * Returns the invoice as a base64-encoded PDF (ORPC's IPC-over-JSON link
   * can't stream raw binary well — the renderer decodes and either shows
   * it in a preview pane or hands it to Electron's print API).
   *
   * The order itself carries no payment fields. The deposit shown on the
   * invoice (if any) is looked up separately, by asking PaymentsService
   * for whatever payment exact-matches the order's own `orderDate`
   * timestamp — the same correlation-by-timestamp OrdersService used to
   * write it in the first place. No `orderId` column on payments is ever
   * involved.
   */
  getInvoicePdf: os
    .input(z.object({ orderId: z.number().int() }))
    .handler(async ({ input, context }) => {
      const orderResult = await context.services.orders.getById(input.orderId)
      const order = orderResult.match({
        ok: (v) => v,
        err: (e) => {
          throw context.toORPCError(e)
        }
      })

      const clientResult = await context.services.clients.getById(order.clientId)
      const client = clientResult.match({
        ok: (v) => v,
        err: (e) => {
          throw context.toORPCError(e)
        }
      })

      const depositResult = await context.services.payments.getDepositAtTimestamp(
        order.clientId,
        order.orderDate
      )
      const depositAmount = depositResult.match({
        ok: (v) => v,
        err: (e) => {
          throw context.toORPCError(e)
        }
      })

      const pdfBuffer = await generateInvoicePdf(
        order,
        client,
        depositAmount,
        context.arabicFontPath
      )
      return {
        filename: `invoice-${order.invoiceNumber}.pdf`,
        base64: pdfBuffer.toString('base64')
      }
    })
})
