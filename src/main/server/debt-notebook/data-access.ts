import { eq, desc } from 'drizzle-orm'
import type { AppDb } from '../../db/client'
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
  initialDebt: debtEntries.initialDebt,
  createdAt: debtEntries.createdAt
}

const DEBT_TRANSACTION_COLUMNS = {
  id: debtTransactions.id,
  debtEntryId: debtTransactions.debtEntryId,
  type: debtTransactions.type,
  amount: debtTransactions.amount,
  date: debtTransactions.date,
  note: debtTransactions.note
}

export class DebtNotebookDataAccess {
  constructor(private readonly db: AppDb) {}

  async findAll() {
    const entries = await this.db
      .select(DEBT_ENTRY_COLUMNS)
      .from(debtEntries)
      .orderBy(desc(debtEntries.createdAt))
    return Promise.all(entries.map((e) => this.attachTransactions(e)))
  }

  async findById(id: number) {
    const [entry] = await this.db
      .select(DEBT_ENTRY_COLUMNS)
      .from(debtEntries)
      .where(eq(debtEntries.id, id))
    if (!entry) return null
    return this.attachTransactions(entry)
  }

  private async attachTransactions<T extends { id: number; initialDebt: number }>(entry: T) {
    const transactions = await this.db
      .select(DEBT_TRANSACTION_COLUMNS)
      .from(debtTransactions)
      .where(eq(debtTransactions.debtEntryId, entry.id))
      .orderBy(desc(debtTransactions.date))

    const remainingBalance = transactions.reduce(
      (balance, t) => balance + (t.type === 'charge' ? t.amount : -t.amount),
      entry.initialDebt
    )

    return { ...entry, transactions, remainingBalance }
  }

  async create(input: CreateDebtEntryInput) {
    const [row] = await this.db
      .insert(debtEntries)
      .values({ clientName: input.clientName, initialDebt: input.initialDebt })
      .returning(DEBT_ENTRY_COLUMNS)
    return this.attachTransactions(row)
  }

  async addTransaction(input: AddDebtTransactionInput) {
    await this.db.insert(debtTransactions).values({
      debtEntryId: input.debtEntryId,
      type: input.type,
      amount: input.amount,
      note: input.note ?? null
    })
    return this.findById(input.debtEntryId)
  }

  async delete(id: number) {
    const [row] = await this.db
      .delete(debtEntries)
      .where(eq(debtEntries.id, id))
      .returning(DEBT_ENTRY_COLUMNS)
    return row ?? null
  }
}
