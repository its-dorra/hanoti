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
  initialDebt: z.number(),
  createdAt: z.coerce.date(),
  transactions: z.array(DebtTransactionSchema).default([]),
  remainingBalance: z.number() // computed: initialDebt + charges - deposits
})
export type DebtEntry = z.infer<typeof DebtEntrySchema>

export const CreateDebtEntrySchema = z.object({
  clientName: z.string().trim().min(1),
  initialDebt: z.number().default(0)
})
export type CreateDebtEntryInput = z.infer<typeof CreateDebtEntrySchema>

export const AddDebtTransactionSchema = z.object({
  debtEntryId: z.number().int(),
  type: z.enum(['deposit', 'charge']),
  amount: z.number().positive(),
  note: z.string().trim().min(1).nullable().optional()
})
export type AddDebtTransactionInput = z.infer<typeof AddDebtTransactionSchema>
