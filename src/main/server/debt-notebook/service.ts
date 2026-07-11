import { Result } from 'better-result'
import { DebtNotebookDataAccess } from './data-access'
import { DebtEntryNotFoundError, DatabaseError, type AppError } from '../../lib/errors'
import type {
  DebtEntry,
  CreateDebtEntryInput,
  AddDebtTransactionInput
} from '../../../shared/schemas/debt-notebook.schema'

/**
 * No `as unknown as DebtEntry` casts: `DebtNotebookDataAccess` selects
 * exactly the columns `DebtEntry`/`DebtTransaction` need and computes
 * `remainingBalance` itself, so the composed object already matches.
 */
export class DebtNotebookService {
  constructor(private readonly dataAccess: DebtNotebookDataAccess) {}

  async list(): Promise<Result<DebtEntry[], AppError>> {
    try {
      const rows = await this.dataAccess.findAll()
      return Result.ok(rows)
    } catch (cause) {
      return Result.err(new DatabaseError({ message: 'Failed to list debt entries', cause }))
    }
  }

  async getById(id: number): Promise<Result<DebtEntry, AppError>> {
    try {
      const row = await this.dataAccess.findById(id)
      if (!row) return Result.err(new DebtEntryNotFoundError({ debtEntryId: id }))
      return Result.ok(row)
    } catch (cause) {
      return Result.err(new DatabaseError({ message: 'Failed to fetch debt entry', cause }))
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

  async addTransaction(input: AddDebtTransactionInput): Promise<Result<DebtEntry, AppError>> {
    try {
      const row = await this.dataAccess.addTransaction(input)
      if (!row) return Result.err(new DebtEntryNotFoundError({ debtEntryId: input.debtEntryId }))
      return Result.ok(row)
    } catch (cause) {
      return Result.err(new DatabaseError({ message: 'Failed to record transaction', cause }))
    }
  }

  /**
   * Returns just the deleted entry's base fields — not a full `DebtEntry`
   * with `transactions`/`remainingBalance`, since those transactions are
   * gone along with the entry and there's nothing left to compute a
   * balance from. Callers only need this to confirm which entry was
   * removed.
   */
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
