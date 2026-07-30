import { z } from 'zod'

export const OrderItemSchema = z.object({
  id: z.number().int(),
  orderId: z.number().int(),
  productId: z.number().int(),
  productNameSnapshot: z.string(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().nonnegative(),
  lineTotal: z.number().nonnegative()
})
export type OrderItem = z.infer<typeof OrderItemSchema>

export const OrderSchema = z.object({
  id: z.number().int(),
  clientId: z.number().int(),
  orderDate: z.coerce.date(),
  subtotal: z.number().nonnegative(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  clientName: z.string(),
  items: z.array(OrderItemSchema).default([])
})
export type Order = z.infer<typeof OrderSchema>

// One line in the "create order" form. Exactly one of `priceId` (a
// predefined amount) or `customUnitPrice` must be provided — not zero,
// and not both at once (the backend would otherwise silently prefer
// `priceId` and ignore `customUnitPrice`, masking a frontend bug that
// sent both).
const CreateOrderItemSchema = z
  .object({
    productId: z.number().int().positive(),
    quantity: z.number().int().positive(),
    priceId: z.number().int().positive().optional(),
    customUnitPrice: z.number().nonnegative().optional()
  })
  .refine((v) => (v.priceId !== undefined) !== (v.customUnitPrice !== undefined), {
    message: 'Provide exactly one of priceId or customUnitPrice',
    path: ['priceId']
  })

export const CreateOrderSchema = z.object({
  clientId: z.number().int().positive(),
  items: z.array(CreateOrderItemSchema).min(1, 'Order must have at least one item'),
  depositAmount: z.number().nonnegative().default(0)
})
export type CreateOrderInput = z.infer<typeof CreateOrderSchema>

export const OrderCursorSchema = z.object({
  orderDate: z.coerce.date(),
  id: z.number().int()
})
export type OrderCursor = z.infer<typeof OrderCursorSchema>

export const OrderFilterSchema = z
  .object({
    clientId: z.number().int().positive().optional(),
    dateFrom: z.coerce.date().optional(),
    dateTo: z.coerce.date().optional(),
    cursor: OrderCursorSchema.nullable().optional(),
    limit: z.number().int().min(1).max(100).default(20),
    query: z.string().optional()
  })
  .refine((v) => !v.dateFrom || !v.dateTo || v.dateFrom <= v.dateTo, {
    message: 'dateFrom must be before or equal to dateTo',
    path: ['dateTo']
  })
export type OrderFilterInput = z.infer<typeof OrderFilterSchema>

export const PaginatedOrdersSchema = z.object({
  items: z.array(OrderSchema),
  nextCursor: OrderCursorSchema.nullable()
})
export type PaginatedOrders = z.infer<typeof PaginatedOrdersSchema>

export const UpdateOrderSchema = z.object({
  id: z.number().int().positive(),
  items: z.array(CreateOrderItemSchema).optional()
})
export type UpdateOrderInput = z.infer<typeof UpdateOrderSchema>
