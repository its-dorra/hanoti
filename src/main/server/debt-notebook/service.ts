import { Result } from 'better-result'
import { DebtNotebookDataAccess } from './data-access'
import { DebtEntryNotFoundError, DatabaseError, type AppError } from '../../lib/errors'
import type {
  DebtEntry,
  CreateDebtEntryInput,
  AddDebtTransactionInput,
  DebtEntryWithCursor,
  UpdateDebtTransactionInput
} from '../../../shared/schemas/debt-notebook.schema'
import { AppDb } from '../../db/client'

/**
 * No `as unknown as DebtEntry` casts: `DebtNotebookDataAccess` selects
 * exactly the columns `DebtEntry`/`DebtTransaction` need and computes
 * `remainingBalance` itself, so the composed object already matches.
 */
export class DebtNotebookService {
  constructor(
    private readonly dataAccess: DebtNotebookDataAccess,
    private readonly db: AppDb
  ) {}

  async findByDebtEntryId(debtEntryId: number): Promise<Result<DebtEntry, AppError>> {
    try {
      const row = await this.dataAccess.findByDebtEntryId(debtEntryId)
      if (!row) return Result.err(new DebtEntryNotFoundError({ debtEntryId }))
      return Result.ok(row)
    } catch (cause) {
      return Result.err(new DatabaseError({ message: 'Failed to find debt entry', cause }))
    }
  }

  async list(
    type: 'buyer' | 'seller',
    query: string,
    cursor?: { createdAt: Date; id: number } | null,
    limit?: number
  ): Promise<Result<DebtEntryWithCursor, AppError>> {
    try {
      const rows = await this.dataAccess.findAll(type, query, cursor, limit)
      if (limit !== undefined) {
        const hasNextPage = rows.length > limit

        const items = hasNextPage ? rows.slice(0, limit) : rows

        const nextCursor =
          hasNextPage && items.length > 0
            ? { createdAt: items[items.length - 1].createdAt, id: items[items.length - 1].id }
            : null
        return Result.ok({ items, nextCursor })
      }
      return Result.ok({ items: rows, nextCursor: null })
    } catch (cause) {
      return Result.err(new DatabaseError({ message: 'Failed to list debt entries', cause }))
    }
  }

  async listTransactions(
    debtEntryId: number,
    cursor?: { createdAt: Date; id: number } | null,
    limit?: number
  ) {
    try {
      const rows = await this.dataAccess.findAllTransactions(debtEntryId, cursor, limit)
      if (limit !== undefined) {
        const hasNextPage = rows.length > limit

        const items = hasNextPage ? rows.slice(0, limit) : rows

        const nextCursor =
          hasNextPage && items.length > 0
            ? { createdAt: items[items.length - 1].createdAt, id: items[items.length - 1].id }
            : null
        return Result.ok({ items, nextCursor })
      }
      return Result.ok({ items: rows, nextCursor: null })
    } catch (cause) {
      return Result.err(new DatabaseError({ message: 'Failed to list debt entries', cause }))
    }
  }

  async create(input: CreateDebtEntryInput): Promise<Result<DebtEntry, AppError>> {
    try {
      const row = await this.dataAccess.create(input)
      return Result.ok(row)
    } catch (cause) {
      return Result.err(new DatabaseError({ message: 'Failed to create debt entry', cause }))
    }
  }

  async addTransaction(input: AddDebtTransactionInput): Promise<Result<true, AppError>> {
    try {
      return await this.db.transaction(async (tx) => {
        const row = await this.dataAccess.addTransaction(tx, input)
        if (!row) return Result.err(new DebtEntryNotFoundError({ debtEntryId: input.debtEntryId }))
        return Result.ok(row)
      })
    } catch (cause) {
      return Result.err(new DatabaseError({ message: 'Failed to record transaction', cause }))
    }
  }

  async updateTransaction(transactionId: number, input: UpdateDebtTransactionInput) {
    try {
      return await this.db.transaction(async (tx) => {
        const row = await this.dataAccess.updateTransaction(tx, transactionId, input)
        if (!row) return Result.err(new DebtEntryNotFoundError({ debtEntryId: 0 }))
        return Result.ok(row)
      })
    } catch (cause) {
      return Result.err(new DatabaseError({ message: 'Failed to modify transaction', cause }))
    }
  }

  async deleteTransaction(id: number) {
    try {
      return await this.db.transaction(async (tx) => {
        const result = await this.dataAccess.deleteTransaction(tx, id)
        if (!result) return Result.err(new DebtEntryNotFoundError({ debtEntryId: id }))
        return Result.ok(result)
      })
    } catch (cause) {
      return Result.err(new DatabaseError({ message: 'Failed to delete transaction', cause }))
    }
  }

  async delete(id: number): Promise<Result<{ id: number; clientName: string }, AppError>> {
    try {
      const row = await this.dataAccess.delete(id)
      if (!row) return Result.err(new DebtEntryNotFoundError({ debtEntryId: id }))
      return Result.ok({ id: row.id, clientName: row.clientName })
    } catch (cause) {
      return Result.err(new DatabaseError({ message: 'Failed to delete debt entry', cause }))
    }
  }
}
