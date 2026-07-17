import { Result } from 'better-result'
import { DebtNotebookDataAccess } from './data-access'
import { DebtEntryNotFoundError, DatabaseError, type AppError } from '../../lib/errors'
import type {
  DebtEntry,
  CreateDebtEntryInput,
  AddDebtTransactionInput,
  DebtEntryWithCursor
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

  async list(
    cursor?: { createdAt: Date; id: number },
    limit?: number
  ): Promise<Result<DebtEntryWithCursor, AppError>> {
    try {
      const rows = await this.dataAccess.findAll(cursor, limit)
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
    cursor?: { createdAt: string; id: number },
    limit?: number
  ) {}

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
        await this.dataAccess.modifyDebt(tx, input)

        const row = await this.dataAccess.addTransaction(tx, input)
        if (!row) return Result.err(new DebtEntryNotFoundError({ debtEntryId: input.debtEntryId }))
        return Result.ok(row)
      })
    } catch (cause) {
      return Result.err(new DatabaseError({ message: 'Failed to record transaction', cause }))
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
