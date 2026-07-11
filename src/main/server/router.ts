import { os } from './orpc'
import { clientsRouter } from './clients/handler'
import { productsRouter } from './products/handler'
import { ordersRouter } from './orders/handler'
import { paymentsRouter } from './payments/handler'
import { debtNotebookRouter } from './debt-notebook/handler'

export const appRouter = os.router({
  clients: clientsRouter,
  products: productsRouter,
  orders: ordersRouter,
  payments: paymentsRouter,
  debtNotebook: debtNotebookRouter
})

export type AppRouter = typeof appRouter
