import { z } from 'zod'

export const ProductPriceSchema = z.object({
  id: z.number().int(),
  productId: z.number().int(),
  amount: z.number().nonnegative()
})
export type ProductPrice = z.infer<typeof ProductPriceSchema>

export const ProductSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  buyingPrice: z.number().nonnegative(),
  quantity: z.number().int().min(0),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  prices: z.array(ProductPriceSchema).default([])
})
export type Product = z.infer<typeof ProductSchema>

const PriceInputSchema = z.object({
  amount: z.number().nonnegative()
})

export const CreateProductSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  buyingPrice: z.number().nonnegative(),
  quantity: z.number().int().min(0).default(0),
  prices: z.array(PriceInputSchema).min(1, 'At least one selling price is required')
})
export type CreateProductInput = z.infer<typeof CreateProductSchema>

export const UpdateProductSchema = z.object({
  id: z.number().int(),
  name: z.string().trim().min(1).optional(),
  buyingPrice: z.number().nonnegative().optional(),
  quantity: z.number().int().min(0).optional(),
  prices: z.array(PriceInputSchema).optional()
})
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>

export const ProductSearchSchema = z.object({
  query: z.string().trim().default('')
})

// Used internally by OrderService when it asks ProductService to reserve stock.
export const AdjustStockSchema = z.object({
  productId: z.number().int(),
  // Positive to increase stock, negative to decrease. Result is clamped to 0.
  delta: z.number().int()
})
export type AdjustStockInput = z.infer<typeof AdjustStockSchema>
