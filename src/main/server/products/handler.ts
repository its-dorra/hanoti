import { os } from '../orpc'
import { z } from 'zod'
import {
  CreateProductSchema,
  UpdateProductSchema,
  ProductSearchSchema
} from '../../../shared/schemas/product.schema'

export const productsRouter = os.router({
  list: os.input(ProductSearchSchema).handler(async ({ input, context }) => {
    const result = await context.services.products.list(input.query)
    return result.match({
      ok: (v) => v,
      err: (e) => {
        throw context.toORPCError(e)
      }
    })
  }),

  getById: os.input(z.object({ id: z.number().int() })).handler(async ({ input, context }) => {
    const result = await context.services.products.getById(input.id)
    return result.match({
      ok: (v) => v,
      err: (e) => {
        throw context.toORPCError(e)
      }
    })
  }),

  create: os.input(CreateProductSchema).handler(async ({ input, context }) => {
    const result = await context.services.products.create(input)
    return result.match({
      ok: (v) => v,
      err: (e) => {
        throw context.toORPCError(e)
      }
    })
  }),

  update: os.input(UpdateProductSchema).handler(async ({ input, context }) => {
    const result = await context.services.products.update(input)
    return result.match({
      ok: (v) => v,
      err: (e) => {
        throw context.toORPCError(e)
      }
    })
  }),

  delete: os.input(z.object({ id: z.number().int() })).handler(async ({ input, context }) => {
    const result = await context.services.products.delete(input.id)
    return result.match({
      ok: (v) => v,
      err: (e) => {
        throw context.toORPCError(e)
      }
    })
  })
})
