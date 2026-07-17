import { sql } from 'drizzle-orm'
import { sqliteTable, text, integer, real, index, uniqueIndex } from 'drizzle-orm/sqlite-core'

// ---------------------------------------------------------------------------
// MODULE 1 — Grocery Store Management
// ---------------------------------------------------------------------------

export const clients = sqliteTable(
  'clients',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    phone: text('phone'),
    notes: text('notes'),
    debt: real('debt').notNull().default(0),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`)
  },
  (table) => [
    index('clients_name_id_idx').on(table.name, table.id),
    index('clients_id_created_at_idx').on(table.id, table.createdAt)
  ]
)

export const products = sqliteTable(
  'products',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    buyingPrice: real('buying_price').notNull(),
    quantity: integer('quantity').notNull().default(0),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`)
  },
  (t) => [
    uniqueIndex('products_name_idx').on(t.name),
    index('products_id_created_at_idx').on(t.id, t.createdAt)
  ]
)

// Predefined selling price tiers for a product (e.g. multiple prices to
// choose from at order time — no name/label, just amounts).
export const productPrices = sqliteTable('product_prices', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  productId: integer('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  amount: real('amount').notNull()
})

export const orders = sqliteTable(
  'orders',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    // Stable, human-readable, sequential invoice number (separate from PK)
    invoiceNumber: integer('invoice_number').notNull(),
    clientId: integer('client_id')
      .notNull()
      .references(() => clients.id),
    orderDate: integer('order_date', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
    status: text('status', { enum: ['open', 'cancelled'] })
      .notNull()
      .default('open'),
    subtotal: real('subtotal').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`)
  },
  (table) => [
    index('orders_client_id_order_date_idx').on(table.clientId, table.orderDate),
    index('orders_id_created_at_idx').on(table.id, table.createdAt)
  ]
)

export const orderItems = sqliteTable('order_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  orderId: integer('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  productId: integer('product_id')
    .notNull()
    .references(() => products.id),
  // Snapshots taken at order time so reprints never change retroactively.
  productNameSnapshot: text('product_name_snapshot').notNull(),
  quantity: integer('quantity').notNull(),
  unitPrice: real('unit_price').notNull(),
  lineTotal: real('line_total').notNull()
})

// Client-scoped payments. Deliberately has no relation to orders at all —
// payments and orders are independent concerns; a payment simply reduces
// the client's running `debt` balance (see clients.debt above).
export const payments = sqliteTable('payments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  clientId: integer('client_id')
    .notNull()
    .references(() => clients.id),
  amount: real('amount').notNull(),
  paymentDate: integer('payment_date', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  note: text('note'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`)
})

// ---------------------------------------------------------------------------
// MODULE 2 — Simple Debt Notebook (fully isolated, no FK to clients above)
// ---------------------------------------------------------------------------

export const debtEntries = sqliteTable(
  'debt_entries',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    clientName: text('client_name').notNull(),
    debt: real('debt').notNull().default(0),
    type: text('type', { enum: ['buyer', 'seller'] }).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`)
  },
  (t) => [index('debt_entries_id_created_at_idx').on(t.id, t.createdAt)]
)

export const debtTransactions = sqliteTable(
  'debt_transactions',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    debtEntryId: integer('debt_entry_id')
      .notNull()
      .references(() => debtEntries.id, { onDelete: 'cascade' }),
    type: text('type', { enum: ['deposit', 'charge'] }).notNull(),
    amount: real('amount').notNull(),
    date: integer('date', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
    note: text('note'),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`)
  },
  (t) => [index('debt_transactions_id_created_at').on(t.id, t.createdAt)]
)
