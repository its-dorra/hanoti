import { os } from '../orpc'
// import { z } from 'zod'
import { RecordPaymentSchema } from '../../../shared/schemas/payment.schema'

export const paymentsRouter = os.router({
  // listForClient: os
  //   .input(z.object({ clientId: z.number().int() }))
  //   .handler(async ({ input, context }) => {
  //     const result = await context.services.payments.listForClient(input.clientId)
  //     return result.match({
  //       ok: (v) => v,
  //       err: (e) => {
  //         throw context.toORPCError(e)
  //       }
  //     })
  //   }),

  record: os.input(RecordPaymentSchema).handler(async ({ input, context }) => {
    const result = await context.services.payments.recordPayment(input)
    return result.match({
      ok: (v) => v,
      err: (e) => {
        throw context.toORPCError(e)
      }
    })
  })

  // update: os
  //   .input(z.object({ paymentId: z.number().int(), data: RecordPaymentSchema }))
  //   .handler(async ({ input, context }) => {
  //     const result = await context.services.payments.modifyPayment(input.paymentId, input.data)
  //     return result.match({
  //       ok: (v) => v,
  //       err: (e) => {
  //         throw context.toORPCError(e)
  //       }
  //     })
  //   }),

  // delete: os
  //   .input(z.object({ paymentId: z.number().int() }))
  //   .handler(async ({ input, context }) => {
  //     const result = await context.services.payments.deletePayment(input.paymentId)
  //     return result.match({
  //       ok: (v) => v,
  //       err: (e) => {
  //         throw context.toORPCError(e)
  //       }
  //     })
  //   })
})
