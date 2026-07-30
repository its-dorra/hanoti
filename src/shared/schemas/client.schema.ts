import { z } from 'zod'

export const ClientSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  phone: z.string().nullable(),
  notes: z.string().nullable(),
  balance: z.number(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date()
})
export type Client = z.infer<typeof ClientSchema>

export const CreateClientSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  phone: z.string().trim().min(1).nullable().optional(),
  notes: z.string().trim().min(1).nullable().optional()
})
export type CreateClientInput = z.infer<typeof CreateClientSchema>

export const UpdateClientSchema = CreateClientSchema.partial().extend({
  id: z.number().int()
})
export type UpdateClientInput = z.infer<typeof UpdateClientSchema>

export const ClientCursorSchema = z.object({
  createdAt: z.coerce.date(),
  id: z.number().int()
})
export type ClientCursor = z.infer<typeof ClientCursorSchema>

export const ClientSearchSchema = z.object({
  query: z.string().trim().default(''),
  cursor: ClientCursorSchema.nullable().optional(),
  limit: z.number().int().min(1).max(100000).optional()
})

export const PaginatedClientsSchema = z.object({
  items: z.array(ClientSchema),
  nextCursor: ClientCursorSchema.nullable()
})
export type PaginatedClients = z.infer<typeof PaginatedClientsSchema>

// Balance is just the client's `debt` column — no SUM()/aggregation
// query needed. This type exists mainly so the ORPC endpoint has a
// clearly named, minimal output shape.
export const ClientBalanceSchema = z.object({
  clientId: z.number().int(),
  balance: z.number()
})
export type ClientBalance = z.infer<typeof ClientBalanceSchema>
