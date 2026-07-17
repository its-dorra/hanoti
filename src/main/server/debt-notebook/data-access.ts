import { eq, desc, sql, or, lt, and } from 'drizzle-orm'
import type { AppDb, AppTransaction } from '../../db/client'
import { debtEntries, debtTransactions } from '../../db/schema'
import type {
  CreateDebtEntryInput,
  AddDebtTransactionInput
} from '../../../shared/schemas/debt-notebook.schema'

/**
 * Deliberately isolated from ClientsDataAccess — the Debt Notebook module
 * does not share clients with the grocery management module (client names
 * here are free text, not a foreign key).
 *
 * Explicit column lists here too, for the same reason as every other
 * data-access file: the returned shape matches `DebtEntry`/
 * `DebtTransaction` exactly, so the service needs no cast.
 */

const DEBT_ENTRY_COLUMNS = {
  id: debtEntries.id,
  clientName: debtEntries.clientName,
  debt: debtEntries.debt,
  createdAt: debtEntries.createdAt
}

export class DebtNotebookDataAccess {
  constructor(private readonly db: AppDb) {}

  async findAll(cursor?: { createdAt: Date; id: number }, limit?: number) {
    const queryLimit = limit ?? 20
    const entries = await this.db
      .select(DEBT_ENTRY_COLUMNS)
      .from(debtEntries)
      .where(
        cursor
          ? or(
              lt(debtEntries.createdAt, cursor.createdAt),
              and(eq(debtEntries.createdAt, cursor.createdAt), lt(debtEntries.id, cursor.id))
            )
          : undefined
      )
      .orderBy(desc(debtEntries.createdAt), desc(debtEntries.id))
      .limit(queryLimit + 1)
    return entries
  }

  async findAllTransactions(
    debtEntryId: number,
    cursor?: { createdAt: Date; id: number },
    limit?: number
  ) {
    const queryLimit = limit ?? 20
    const entries = await this.db
      .select(DEBT_ENTRY_COLUMNS)
      .from(debtEntries)
      .where(
        cursor
          ? or(
              lt(debtEntries.createdAt, cursor.createdAt),
              and(eq(debtEntries.createdAt, cursor.createdAt), lt(debtEntries.id, cursor.id))
            )
          : undefined
      )
      .orderBy(desc(debtEntries.createdAt), desc(debtEntries.id))
      .limit(queryLimit + 1)
    return entries
  }

  async create(input: CreateDebtEntryInput) {
    const [row] = await this.db
      .insert(debtEntries)
      .values({ clientName: input.clientName, debt: input.debt, type: input.type })
      .returning(DEBT_ENTRY_COLUMNS)
    return row
  }

  async modifyDebt(
    tx: AppTransaction,
    input: { debtEntryId: number; amount: number; type: 'charge' | 'deposit' }
  ) {
    tx.update(debtEntries)
      .set({
        debt: sql`${debtEntries.debt} + ${input.type === 'charge' ? input.amount : -input.amount}`
      })
      .where(eq(debtEntries.id, input.debtEntryId))
  }

  async addTransaction(tx: AppTransaction, input: AddDebtTransactionInput) {
    await tx.insert(debtTransactions).values({
      debtEntryId: input.debtEntryId,
      type: input.type,
      amount: input.amount,
      note: input.note ?? null
    })
    return true
  }

  async delete(id: number) {
    const [row] = await this.db
      .delete(debtEntries)
      .where(eq(debtEntries.id, id))
      .returning(DEBT_ENTRY_COLUMNS)
    return row ?? null
  }
}
