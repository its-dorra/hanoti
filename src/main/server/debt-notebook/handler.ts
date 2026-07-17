import { os } from '../orpc'
import { z } from 'zod'
import {
  CreateDebtEntrySchema,
  AddDebtTransactionSchema
} from '../../../shared/schemas/debt-notebook.schema'
import { Result } from 'better-result'

export const debtNotebookRouter = os.router({
  list: os
    .input(
      z.object({
        cursor: z
          .object({ createdAt: z.coerce.date(), id: z.number().int() })
          .nullable()
          .optional(),
        limit: z.number().int().optional().default(20)
      })
    )
    .handler(async ({ input, context }) => {
      const result = await context.services.debtNotebook.list(input.cursor, input.limit)
      return result.match({
        ok: (v) => v,
        err: (e) => {
          throw context.toORPCError(e)
        }
      })
    }),

  listTransactions: os
    .input(
      z.object({
        debtEntryId: z.number().int(),
        cursor: z.object({ createdAt: z.coerce.date(), id: z.number().int() }).optional(),
        limit: z.number().int().optional().default(20)
      })
    )
    .handler(async ({ input, context }) => {
      const result = await context.services.debtNotebook.listTransactions(
        input.debtEntryId,
        input.cursor,
        input.limit
      )
      return Result.match(result, {
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
