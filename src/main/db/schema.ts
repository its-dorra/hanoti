import { sql } from 'drizzle-orm'
import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core'

export const clients = sqliteTable(
  'clients',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    phone: text('phone'),
    notes: text('notes'),
    balance: integer('debt').notNull().default(0),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`)
  },
  (table) => [index('clients_created_at_id_idx').on(table.createdAt, table.id)]
)

export const products = sqliteTable(
  'products',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull().unique(),
    buyingPrice: real('buying_price').notNull(),
    quantity: integer('quantity').notNull().default(0),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`)
  },
  (t) => [index('products_created_at_id_idx').on(t.createdAt, t.id)]
)

export const productPrices = sqliteTable(
  'product_prices',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    productId: integer('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    amount: real('amount').notNull()
  },
  (t) => [index('product_prices_product_id_idx').on(t.productId)]
)

export const orders = sqliteTable(
  'orders',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    clientId: integer('client_id')
      .notNull()
      .references(() => clients.id, { onDelete: 'cascade' }),
    orderDate: integer('order_date', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
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
    index('orders_client_id_order_date_id_idx').on(table.clientId, table.orderDate, table.id)
  ]
)

export const orderItems = sqliteTable(
  'order_items',
  {
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
  },
  (t) => [index('order_items_order_id_idx').on(t.orderId)]
)

export const payments = sqliteTable(
  'payments',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    clientId: integer('client_id')
      .notNull()
      .references(() => clients.id, { onDelete: 'cascade' }),
    amount: real('amount').notNull(),
    paymentDate: integer('payment_date', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
    note: text('note'),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`)
  },
  (table) => [index('payments_client_id_payment_date_idx').on(table.clientId, table.paymentDate)]
)

export const clientLedgers = sqliteTable('client_ledgers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  clientId: integer('client_id')
    .notNull()
    .references(() => clients.id, { onDelete: 'cascade' }),
  referenceId: integer('reference_id').notNull(),
  referenceType: text('reference_type', { enum: ['order', 'payment'] }).notNull(),
  amount: integer('amount').notNull(),
  balanceBefore: integer('balance_before').notNull(),
  balanceAfter: integer('balance_after').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`)
})

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
