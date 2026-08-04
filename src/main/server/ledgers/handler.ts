import z from 'zod'
import { os } from '../orpc'
import { generateInvoicePdf } from '../orders/invoices/generate-invoice'
import { Result } from 'better-result'
import { generateClientResumeStatementPdf } from '../orders/invoices/generate-resume'

const listAllInputSchema = z.object({
  clientId: z.number().int(),
  type: z.enum(['order', 'payment', 'all']).default('all'),
  limit: z.number().int().optional(),
  cursor: z
    .object({
      createdAt: z.coerce.date(),
      id: z.number().int()
    })
    .optional()
    .nullable(),
  before: z.coerce.date().optional()
})

export const clientLedgersRoute = os.router({
  listAll: os.input(listAllInputSchema).handler(async ({ input, context }) => {
    const { clientId, type, limit, cursor, before } = input
    const result = await context.services.clientLedgers.findAll(
      clientId,
      type,
      limit,
      cursor,
      before
    )

    return Result.match(result, {
      ok: (v) => v,
      err: (e) => {
        throw context.toORPCError(e)
      }
    })
  }),
  deleteLastLedger: os
    .input(z.object({ clientId: z.number().int() }))
    .handler(async ({ input, context }) => {
      const result = await context.services.clientLedgers.deleteLastLedgerEntry(input.clientId)

      return Result.match(result, {
        ok: (v) => v,
        err: (e) => {
          throw context.toORPCError(e)
        }
      })
    }),
  getInvoicePdf: os
    .input(z.object({ orderId: z.number().int(), resumeDate: z.date().optional() }))
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

      const depositResult = input.resumeDate
        ? await context.services.clientLedgers.getResumeBalanceByDate(
            order.clientId,
            input.resumeDate
          )
        : undefined
      const depositAmount =
        depositResult &&
        Result.match(depositResult, {
          ok: (v) => v,
          err: (e) => {
            throw context.toORPCError(e)
          }
        })

      const pdfBuffer = await generateInvoicePdf(
        order,
        client,
        context.arabicFontPath,
        depositAmount
      )
      return {
        filename: `invoice-${order.id}.pdf`,
        base64: pdfBuffer.toString('base64')
      }
    }),
  getResumePdf: os
    .input(z.object({ clientId: z.number().int(), resumeDate: z.coerce.date() }))
    .handler(async ({ input, context }) => {
      const clientResult = await context.services.clients.getById(input.clientId)
      const client = clientResult.match({
        ok: (v) => v,
        err: (e) => {
          throw context.toORPCError(e)
        }
      })

      const depositResult = await context.services.clientLedgers.getResumeBalanceByDate(
        input.clientId,
        input.resumeDate
      )

      const depositAmount = Result.match(depositResult, {
        ok: (v) => v,
        err: (e) => {
          throw context.toORPCError(e)
        }
      })

      const pdfBuffer = await generateClientResumeStatementPdf(
        client,
        depositAmount,
        context.arabicFontPath
      )
      return {
        filename: `resume-${client.id}-${input.resumeDate.toISOString().split('T')[0]}.pdf`,
        base64: pdfBuffer.toString('base64')
      }
    })
})
