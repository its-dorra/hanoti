import z from 'zod'
import { os } from '../orpc'

const listAllInputSchema = z.object({
  clientId: z.number().int(),
  type: z.enum(['order', 'payment', 'all']).default('all'),
  limit: z.number().int().optional(),
  cursor: z
    .object({
      createdAt: z.date(),
      id: z.number().int()
    })
    .optional(),
  before: z.date().optional()
})

export const clientLedgersRoute = os.router({
  listAll: os.input(listAllInputSchema).handler(async ({ input, context }) => {
    const { clientId, type, limit, cursor, before } = input
    return context.services.clientLedgers.findAll(clientId, type, limit, cursor, before)
  }),
  deleteLastLedger: os.handler(async ({ context }) => {
    return context.services.clientLedgers.deleteLastLedgerEntry()
  })
})
