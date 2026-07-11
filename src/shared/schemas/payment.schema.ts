import { z } from 'zod'

export const PaymentMethodSchema = z.enum(['cash', 'card', 'transfer', 'other'])

export const PaymentSchema = z.object({
  id: z.number().int(),
  clientId: z.number().int(),
  amount: z.number().positive(),
  paymentDate: z.coerce.date(),
  note: z.string().nullable(),
  createdAt: z.coerce.date()
})
export type Payment = z.infer<typeof PaymentSchema>

// A payment is always a standalone action against a client's running
// `debt` balance — it is never created as a side effect of an order.
export const RecordPaymentSchema = z.object({
  clientId: z.number().int(),
  amount: z.number().positive(),
  method: PaymentMethodSchema.default('cash'),
  note: z.string().trim().min(1).nullable().optional()
})
export type RecordPaymentInput = z.infer<typeof RecordPaymentSchema>
