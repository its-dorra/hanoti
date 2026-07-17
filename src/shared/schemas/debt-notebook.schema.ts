import { z } from 'zod'

export const DebtTransactionSchema = z.object({
  id: z.number().int(),
  debtEntryId: z.number().int(),
  type: z.enum(['deposit', 'charge']),
  amount: z.number().positive(),
  date: z.coerce.date(),
  note: z.string().nullable()
})
export type DebtTransaction = z.infer<typeof DebtTransactionSchema>

export const DebtEntrySchema = z.object({
  id: z.number().int(),
  clientName: z.string(),
  debt: z.number(),
  createdAt: z.coerce.date()
})
export type DebtEntry = z.infer<typeof DebtEntrySchema>

export type DebtEntryWithCursor = {
  items: DebtEntry[]
  nextCursor: {
    createdAt: Date
    id: number
  } | null
}

export const CreateDebtEntrySchema = z.object({
  clientName: z.string().trim().min(1),
  debt: z.number().default(0),
  type: z.enum(['buyer', 'seller'])
})
export type CreateDebtEntryInput = z.infer<typeof CreateDebtEntrySchema>

export const AddDebtTransactionSchema = z.object({
  debtEntryId: z.number().int(),
  type: z.enum(['deposit', 'charge']),
  amount: z.number().positive(),
  note: z.string().trim().min(1).nullable().optional()
})
export type AddDebtTransactionInput = z.infer<typeof AddDebtTransactionSchema>
