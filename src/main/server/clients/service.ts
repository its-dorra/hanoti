import { Result } from 'better-result'
import { ClientsDataAccess } from './data-access'
import { ClientNotFoundError, DatabaseError, type AppError } from '../../lib/errors'
import type {
  CreateClientInput,
  UpdateClientInput,
  Client,
  ClientCursor,
  PaginatedClients
} from '../../../shared/schemas/client.schema'
import type { AppTransaction } from '../../db/client'

/**
 * All business logic for the Clients domain lives here. Handlers never
 * touch the data-access layer directly; they only ever call this service.
 *
 * No `as unknown as Client` casts here: `ClientsDataAccess` selects the
 * exact columns `Client` needs (see CLIENT_COLUMNS there), so the row it
 * returns already structurally matches `Client` — TypeScript accepts it
 * directly.
 */
export class ClientsService {
  constructor(private readonly dataAccess: ClientsDataAccess) {}

  async list(input: {
    query: string
    cursor?: ClientCursor | null
    limit?: number
  }): Promise<Result<PaginatedClients, AppError>> {
    try {
      const rows = await this.dataAccess.findAll(input.query, input.cursor, input.limit)
      if (input.limit !== undefined) {
        const hasNextPage = rows.length > input.limit
        const items = hasNextPage ? rows.slice(0, input.limit) : rows
        const nextCursor =
          hasNextPage && items.length > 0
            ? { createdAt: items[items.length - 1].createdAt, id: items[items.length - 1].id }
            : null
        return Result.ok({ items, nextCursor })
      } else {
        return Result.ok({ items: rows, nextCursor: null })
      }
    } catch (cause) {
      return Result.err(new DatabaseError({ message: 'Failed to list clients', cause }))
    }
  }

  async getById(id: number): Promise<Result<Client, AppError>> {
    try {
      const row = await this.dataAccess.findById(id)
      if (!row) return Result.err(new ClientNotFoundError({ clientId: id }))
      return Result.ok(row)
    } catch (cause) {
      return Result.err(new DatabaseError({ message: 'Failed to fetch client', cause }))
    }
  }

  async create(input: CreateClientInput): Promise<Result<Client, AppError>> {
    try {
      const row = await this.dataAccess.create(input)
      return Result.ok(row)
    } catch (cause) {
      return Result.err(new DatabaseError({ message: 'Failed to create client', cause }))
    }
  }

  async update(input: UpdateClientInput): Promise<Result<Client, AppError>> {
    try {
      const row = await this.dataAccess.update(input)
      if (!row) return Result.err(new ClientNotFoundError({ clientId: input.id }))
      return Result.ok(row)
    } catch (cause) {
      return Result.err(new DatabaseError({ message: 'Failed to update client', cause }))
    }
  }

  async delete(id: number): Promise<Result<Client, AppError>> {
    try {
      const row = await this.dataAccess.delete(id)
      if (!row) return Result.err(new ClientNotFoundError({ clientId: id }))
      return Result.ok(row)
    } catch (cause) {
      return Result.err(new DatabaseError({ message: 'Failed to delete client', cause }))
    }
  }

  /**
   * Internal — called by OrdersService (order creation/edit) and
   * PaymentsService (recording a payment) inside their own transactions,
   * per the cross-service rule: those services never touch the clients
   * table directly, only through this service.
   *
   * `tx` is a required first argument, matching the data-access method it
   * wraps — there's no standalone (non-transactional) use of this method.
   */
  async adjustDebt(
    tx: AppTransaction,
    clientId: number,
    delta: number
  ): Promise<Result<Client, AppError>> {
    try {
      const row = await this.dataAccess.adjustDebt(tx, clientId, delta)
      if (!row) return Result.err(new ClientNotFoundError({ clientId }))
      return Result.ok(row)
    } catch (cause) {
      return Result.err(new DatabaseError({ message: 'Failed to adjust client debt', cause }))
    }
  }
}
