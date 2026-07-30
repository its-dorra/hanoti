import { os } from './orpc'
import { clientsRouter } from './clients/handler'
import { productsRouter } from './products/handler'
import { ordersRouter } from './orders/handler'
import { paymentsRouter } from './payments/handler'
import { debtNotebookRouter } from './debt-notebook/handler'
import { clientLedgersRoute } from './ledgers/handler'

export const appRouter = os.router({
  clients: clientsRouter,
  products: productsRouter,
  orders: ordersRouter,
  payments: paymentsRouter,
  debtNotebook: debtNotebookRouter,
  ledgers: clientLedgersRoute
})

export type AppRouter = typeof appRouter
