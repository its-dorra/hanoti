import { os } from '../orpc'
import { z } from 'zod'
import {
  CreateDebtEntrySchema,
  AddDebtTransactionSchema
} from '../../../shared/schemas/debt-notebook.schema'

export const debtNotebookRouter = os.router({
  list: os.handler(async ({ context }) => {
    const result = await context.services.debtNotebook.list()
    return result.match({
      ok: (v) => v,
      err: (e) => {
        throw context.toORPCError(e)
      }
    })
  }),

  create: os.input(CreateDebtEntrySchema).handler(async ({ input, context }) => {
    const result = await context.services.debtNotebook.create(input)
    return result.match({
      ok: (v) => v,
      err: (e) => {
        throw context.toORPCError(e)
      }
    })
  }),

  addTransaction: os.input(AddDebtTransactionSchema).handler(async ({ input, context }) => {
    const result = await context.services.debtNotebook.addTransaction(input)
    return result.match({
      ok: (v) => v,
      err: (e) => {
        throw context.toORPCError(e)
      }
    })
  }),

  delete: os.input(z.object({ id: z.number().int() })).handler(async ({ input, context }) => {
    const result = await context.services.debtNotebook.delete(input.id)
    return result.match({
      ok: (v) => v,
      err: (e) => {
        throw context.toORPCError(e)
      }
    })
  })
})
