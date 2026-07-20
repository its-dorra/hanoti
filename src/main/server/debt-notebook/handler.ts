import { os } from '../orpc'
import { z } from 'zod'
import {
  CreateDebtEntrySchema,
  AddDebtTransactionSchema,
  UpdateDebtTransactionSchema
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
        limit: z.number().int().optional().default(20),
        type: z.enum(['buyer', 'seller']),
        query: z.string()
      })
    )
    .handler(async ({ input, context }) => {
      const result = await context.services.debtNotebook.list(
        input.type,
        input.query,
        input.cursor,
        input.limit
      )
      return result.match({
        ok: (v) => v,
        err: (e) => {
          throw context.toORPCError(e)
        }
      })
    }),

  findByDebtEntryId: os
    .input(z.object({ debtEntryId: z.number().int() }))
    .handler(async ({ input, context }) => {
      const result = await context.services.debtNotebook.findByDebtEntryId(input.debtEntryId)
      return Result.match(result, {
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
        cursor: z
          .object({ createdAt: z.coerce.date(), id: z.number().int() })
          .nullable()
          .optional(),
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

  updateTransaction: os.input(UpdateDebtTransactionSchema).handler(async ({ input, context }) => {
    const result = await context.services.debtNotebook.updateTransaction(
      input.transactionId,
      input.input
    )

    if (!result.isOk()) {
      throw context.toORPCError(result.error)
    }
    return result.value
  }),

  deleteTransaction: os
    .input(z.object({ id: z.number().int() }))
    .handler(async ({ input, context }) => {
      const result = await context.services.debtNotebook.deleteTransaction(input.id)
      if (result.isErr()) throw context.toORPCError(result.error)
      return result.value
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
