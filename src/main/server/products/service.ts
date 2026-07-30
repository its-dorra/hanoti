import { Result } from 'better-result'
import { ProductsDataAccess } from './data-access'
import { ProductNotFoundError, DatabaseError, type AppError } from '../../lib/errors'
import type {
  CreateProductInput,
  UpdateProductInput,
  Product
} from '../../../shared/schemas/product.schema'
import type { AppTransaction } from '../../db/client'

/**
 * No `as unknown as Product` casts here: `ProductsDataAccess` selects the
 * exact columns `Product`/`ProductPrice` need, so the composed row it
 * returns already structurally matches `Product` — TypeScript accepts it
 * directly.
 */
export class ProductsService {
  constructor(private readonly dataAccess: ProductsDataAccess) {}

  async list(query: string): Promise<Result<Product[], AppError>> {
    try {
      const rows = await this.dataAccess.findAll(query)
      return Result.ok(rows)
    } catch (cause) {
      return Result.err(new DatabaseError({ message: 'Failed to list products', cause }))
    }
  }

  async getById(id: number): Promise<Result<Product, AppError>> {
    try {
      const row = await this.dataAccess.findById(id)
      if (!row) return Result.err(new ProductNotFoundError({ productId: id }))
      return Result.ok(row)
    } catch (cause) {
      return Result.err(new DatabaseError({ message: 'Failed to fetch product', cause }))
    }
  }

  async create(input: CreateProductInput): Promise<Result<Product, AppError>> {
    try {
      const row = await this.dataAccess.create(input)
      return Result.ok(row)
    } catch (cause) {
      return Result.err(new DatabaseError({ message: 'Failed to create product', cause }))
    }
  }

  async update(input: UpdateProductInput): Promise<Result<Product, AppError>> {
    try {
      const row = await this.dataAccess.update(input)
      if (!row) return Result.err(new ProductNotFoundError({ productId: input.id }))
      return Result.ok(row)
    } catch (cause) {
      return Result.err(new DatabaseError({ message: 'Failed to update product', cause }))
    }
  }

  async delete(id: number): Promise<Result<boolean, AppError>> {
    try {
      await this.dataAccess.delete(id)

      return Result.ok(true)
    } catch (cause) {
      return Result.err(new DatabaseError({ message: 'Failed to delete product', cause }))
    }
  }

  /**
   * Internal — used by OrdersService inside its own transaction. Not
   * exposed directly over ORPC, since stock only changes as a side effect
   * of an order (per the "cross-service" rule: OrderService talks to
   * ProductService, never the products table directly).
   *
   * `tx` is a required first argument: this method only ever runs as one
   * step of a larger atomic operation, never standalone. Returns just the
   * updated stock fields — not a full `Product` — since `adjustStock`
   * never joins `productPrices`, and OrdersService only ever checks
   * success/failure here, never reads the returned value.
   */
  async reserveStockForOrder(
    tx: AppTransaction,
    productId: number,
    quantityOrdered: number
  ): Promise<Result<{ id: number; quantity: number }, AppError>> {
    try {
      const row = await this.dataAccess.adjustStock(tx, productId, -quantityOrdered)
      if (!row) return Result.err(new ProductNotFoundError({ productId }))
      return Result.ok({ id: row.id, quantity: row.quantity })
    } catch (cause) {
      return Result.err(new DatabaseError({ message: 'Failed to adjust stock', cause }))
    }
  }

  async findPriceById(priceId: number) {
    return this.dataAccess.findPriceById(priceId)
  }
}
