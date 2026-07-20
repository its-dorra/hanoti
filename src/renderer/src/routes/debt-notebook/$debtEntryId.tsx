import AddTransactionDialog from '@renderer/features/debt-notebook/components/add-transaction-dialog'
import DebtTransactions from '@renderer/features/debt-notebook/components/debt-transactions'
import { orpc } from '@renderer/integrations/orpc'
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import z from 'zod'

export const Route = createFileRoute('/debt-notebook/$debtEntryId')({
  validateSearch: z.object({
    type: z.enum(['buyer', 'seller'])
  }),
  component: RouteComponent,
  pendingComponent: () => (
    <div className="w-full h-full flex items-center justify-center">
      <Loader2 className="animate-spin size-12" />
    </div>
  )
})

function RouteComponent() {
  const { debtEntryId } = Route.useParams()
  const debtEntryQuery = useSuspenseQuery(
    orpc.debtNotebook.findByDebtEntryId.queryOptions({ input: { debtEntryId: +debtEntryId } })
  )

  return (
    <div className="h-full w-full flex flex-col gap-y-4">
      <Link to="..">الرجوع</Link>
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-y-2">
          <h1 className="text-2xl font-semibold">إسم الزبون : {debtEntryQuery.data.clientName}</h1>
          <p className="text-lg font-semibold">الدين المتبقي : {debtEntryQuery.data.debt}</p>
        </div>
        <AddTransactionDialog debtEntryId={+debtEntryId} />
      </div>
      <DebtTransactions debtEntryId={+debtEntryId} />
    </div>
  )
}
