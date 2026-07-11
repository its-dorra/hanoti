/**
 * Domain error types, built on `better-result`'s TaggedError.
 *
 * NOTE: `better-result`'s exact exported API can differ slightly between
 * versions. This file assumes a neverthrow-like shape:
 *   - `Result<T, E>`, `ok(value)`, `err(error)`
 *   - `TaggedError` base class with a `tag` discriminant
 * If your installed version differs, adjust the imports here only —
 * every service/handler in this codebase depends on this one file, not
 * on `better-result` directly, so the blast radius of an API mismatch
 * is contained to this module.
 */
import { TaggedError } from 'better-result'

export class ClientNotFoundError extends TaggedError('ClientNotFoundError')<{
  clientId: number
}>() {}

export class ProductNotFoundError extends TaggedError('ProductNotFoundError')<{
  productId: number
}>() {}

export class InvalidPriceForProductError extends TaggedError('InvalidPriceForProductError')<{
  productId: number
  priceId: number
}>() {}

export class OrderNotFoundError extends TaggedError('OrderNotFoundError')<{
  orderId: number
}>() {}

export class EmptyOrderError extends TaggedError('EmptyOrderError')<Record<string, never>>() {}

export class OverpaymentError extends TaggedError('OverpaymentError')<{
  subtotal: number
  attemptedPayment: number
}>() {}

export class DebtEntryNotFoundError extends TaggedError('DebtEntryNotFoundError')<{
  debtEntryId: number
}>() {}

export class ValidationFailedError extends TaggedError('ValidationFailedError')<{
  message: string
}>() {}

export class DatabaseError extends TaggedError('DatabaseError')<{
  message: string
  cause?: unknown
}>() {}

export type AppError =
  | ClientNotFoundError
  | ProductNotFoundError
  | InvalidPriceForProductError
  | OrderNotFoundError
  | EmptyOrderError
  | OverpaymentError
  | DebtEntryNotFoundError
  | ValidationFailedError
  | DatabaseError
