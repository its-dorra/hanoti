import { eq, like } from 'drizzle-orm'
import type { AppDb } from '../../db/client'
import { products, productPrices } from '../../db/schema'
import type { CreateProductInput, UpdateProductInput } from '../../../shared/schemas/product.schema'

// Explicit column lists (not `.select()`/`.returning()` with no args) so
// the returned shape matches `Product`/`ProductPrice` precisely, meaning
// the service layer needs no `as unknown as X` cast.
const PRODUCT_COLUMNS = {
  id: products.id,
  name: products.name,
  buyingPrice: products.buyingPrice,
  quantity: products.quantity,
  createdAt: products.createdAt,
  updatedAt: products.updatedAt
}

const PRICE_COLUMNS = {
  id: productPrices.id,
  productId: productPrices.productId,
  amount: productPrices.amount
}

export class ProductsDataAccess {
  constructor(private readonly db: AppDb) {}

  async findAll(query: string) {
    const rows = await this.db
      .select(PRODUCT_COLUMNS)
      .from(products)
      .where(query ? like(products.name, `%${query}%`) : undefined)
      .orderBy(products.name)

    return Promise.all(rows.map((p) => this.attachPrices(p)))
  }

  async findById(id: number) {
    const [row] = await this.db.select(PRODUCT_COLUMNS).from(products).where(eq(products.id, id))
    if (!row) return null
    return this.attachPrices(row)
  }

  private async attachPrices<T extends { id: number }>(product: T) {
    const prices = await this.db
      .select(PRICE_COLUMNS)
      .from(productPrices)
      .where(eq(productPrices.productId, product.id))
    return { ...product, prices }
  }

  async create(input: CreateProductInput) {
    return this.db.transaction(async (tx) => {
      const [product] = await tx
        .insert(products)
        .values({
          name: input.name,
          buyingPrice: input.buyingPrice,
          quantity: input.quantity ?? 0
        })
        .returning(PRODUCT_COLUMNS)

      const prices = await tx
        .insert(productPrices)
        .values(input.prices.map((p) => ({ productId: product.id, amount: p.amount })))
        .returning(PRICE_COLUMNS)

      return { ...product, prices }
    })
  }

  async update(input: UpdateProductInput) {
    return this.db.transaction(async (tx) => {
      const { id, prices, ...rest } = input
      const [product] = await tx
        .update(products)
        .set({ ...rest, updatedAt: new Date() })
        .where(eq(products.id, id))
        .returning(PRODUCT_COLUMNS)

      if (!product) return null

      if (prices) {
        // Full replacement — simplest correct semantics for a small tier list.
        await tx.delete(productPrices).where(eq(productPrices.productId, id))
        await tx
          .insert(productPrices)
          .values(prices.map((p) => ({ productId: id, amount: p.amount })))
      }

      return this.findById(id)
    })
  }

  /**
   * Hard delete — no soft-delete flag anywhere in this schema. Its
   * predefined prices cascade-delete automatically (`productPrices`'
   * `productId` FK has `onDelete: "cascade"`). If the product has
   * existing order-item history, the `order_items.product_id` FK (no
   * cascade configured) rejects this at the SQLite level rather than
   * corrupting past invoices' snapshots.
   */
  async delete(id: number) {
    await this.db.delete(products).where(eq(products.id, id))

    return true
  }

  async findPriceById(priceId: number) {
    const [row] = await this.db
      .select(PRICE_COLUMNS)
      .from(productPrices)
      .where(eq(productPrices.id, priceId))
    return row ?? null
  }

  /**
   * Adjust stock by `delta` (may be negative). Result is clamped to a
   * minimum of 0 — stock is never allowed to go negative, but an order
   * exceeding available stock is still permitted (see OrdersService).
   *
   * This method only ever runs as part of a larger atomic operation
   * (order creation/edit), so `tx` is a required first argument rather
   * than an optional trailing one — there's no standalone call site that
   * would need a non-transactional variant.
   */
  async adjustStock(tx: AppDb, productId: number, delta: number) {
    const [current] = await tx
      .select({ quantity: products.quantity })
      .from(products)
      .where(eq(products.id, productId))
    const next = Math.max(0, (current?.quantity ?? 0) + delta)
    const [row] = await tx
      .update(products)
      .set({ quantity: next, updatedAt: new Date() })
      .where(eq(products.id, productId))
      .returning(PRODUCT_COLUMNS)
    return row ?? null
  }
}
