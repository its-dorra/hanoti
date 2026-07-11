import { os } from '../orpc'
import {
  CreateClientSchema,
  UpdateClientSchema,
  ClientSearchSchema
} from '../../../shared/schemas/client.schema'
import { z } from 'zod'

/**
 * ORPC handlers for the Clients domain.
 *
 * Handlers do exactly two things now: validate input (via `.input(schema)`)
 * and call the service, translating a `Result` into a return value or a
 * typed ORPC error. There's no `.output(schema)` step — the service layer
 * already returns precisely-shaped data (see ClientsDataAccess's explicit
 * column selection), so a second runtime validation pass on the way out
 * would just re-check what's already guaranteed by the data-access layer's
 * shape.
 */
export const clientsRouter = os.router({
  list: os.input(ClientSearchSchema).handler(async ({ input, context }) => {
    const result = await context.services.clients.list(input.query)
    return result.match({
      ok: (clients) => clients,
      err: (e) => {
        throw context.toORPCError(e)
      }
    })
  }),

  getById: os.input(z.object({ id: z.number().int() })).handler(async ({ input, context }) => {
    const result = await context.services.clients.getById(input.id)
    return result.match({
      ok: (client) => client,
      err: (e) => {
        throw context.toORPCError(e)
      }
    })
  }),

  getBalance: os.input(z.object({ id: z.number().int() })).handler(async ({ input, context }) => {
    const result = await context.services.clients.getBalance(input.id)
    return result.match({
      ok: (balance) => balance,
      err: (e) => {
        throw context.toORPCError(e)
      }
    })
  }),

  create: os.input(CreateClientSchema).handler(async ({ input, context }) => {
    const result = await context.services.clients.create(input)
    return result.match({
      ok: (client) => client,
      err: (e) => {
        throw context.toORPCError(e)
      }
    })
  }),

  update: os.input(UpdateClientSchema).handler(async ({ input, context }) => {
    const result = await context.services.clients.update(input)
    return result.match({
      ok: (client) => client,
      err: (e) => {
        throw context.toORPCError(e)
      }
    })
  }),

  delete: os.input(z.object({ id: z.number().int() })).handler(async ({ input, context }) => {
    const result = await context.services.clients.delete(input.id)
    return result.match({
      ok: (client) => client,
      err: (e) => {
        throw context.toORPCError(e)
      }
    })
  })
})
