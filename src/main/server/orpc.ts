import { os as baseOs, ORPCError } from '@orpc/server'
import type { AppDb } from '../db/client'
import type { AppError } from '../lib/errors'
import { ClientsDataAccess } from './clients/data-access'
import { ClientsService } from './clients/service'
import { ProductsDataAccess } from './products/data-access'
import { ProductsService } from './products/service'
import { OrdersDataAccess } from './orders/data-access'
import { OrdersService } from './orders/service'
import { PaymentsDataAccess } from './payments/data-access'
import { PaymentsService } from './payments/service'
import { DebtNotebookDataAccess } from './debt-notebook/data-access'
import { DebtNotebookService } from './debt-notebook/service'

/**
 * Wires the full service graph for a given db instance. Called once in
 * electron/main.ts and passed down as ORPC context.
 */
export function createServices(db: AppDb) {
  const clients = new ClientsService(new ClientsDataAccess(db))
  const products = new ProductsService(new ProductsDataAccess(db))
  const payments = new PaymentsService(new PaymentsDataAccess(db), db, clients)
  const orders = new OrdersService(new OrdersDataAccess(db), db, clients, products, payments)
  const debtNotebook = new DebtNotebookService(new DebtNotebookDataAccess(db), db)

  return { clients, products, orders, payments, debtNotebook }
}
export type Services = ReturnType<typeof createServices>

/** Maps a domain TaggedError to the appropriate ORPC error shape. */
function toORPCError(e: AppError): ORPCError<any, any> {
  switch (e.tag) {
    case 'ClientNotFoundError':
    case 'ProductNotFoundError':
    case 'OrderNotFoundError':
    case 'DebtEntryNotFoundError':
      return new ORPCError('NOT_FOUND', { message: e.tag, data: e })
    case 'InvalidPriceForProductError':
    case 'EmptyOrderError':
    case 'OverpaymentError':
    case 'ValidationFailedError':
      return new ORPCError('BAD_REQUEST', { message: e.tag, data: e })
    case 'DatabaseError':
    default:
      return new ORPCError('INTERNAL_SERVER_ERROR', { message: e.tag, data: e })
  }
}

export interface AppContext {
  services: Services
  toORPCError: typeof toORPCError
  /** Absolute path to the embedded Arabic font used for invoice PDFs. */
  arabicFontPath: string
}

/**
 * Base procedure builder. Every handler.ts imports `os` from here so the
 * context type and error mapping are consistent app-wide.
 *
 * NOTE: exact `.context<T>()` / builder chaining depends on the installed
 * @orpc/server version — check node_modules/@orpc/server's typings if this
 * doesn't line up 1:1, the shape of handlers below will still apply.
 */
export const os = baseOs.$context<AppContext>()

export function buildContext(db: AppDb, arabicFontPath: string): AppContext {
  return {
    services: createServices(db),
    toORPCError,
    arabicFontPath
  }
}
