import { createFileRoute, useParams, Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { ClientPaymentsPage } from '../../../features/payments/components/client-payments-page'

function ClientPaymentsRoute() {
  const { clientId } = useParams({ from: '/clients/$clientId/payments' })
  const id = Number(clientId)

  return (
    <div className="space-y-4">
      <Link
        to="/clients/$clientId"
        params={{ clientId: String(id) }}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowRight className="h-4 w-4" />
        العودة إلى ملف العميل
      </Link>
      <ClientPaymentsPage clientId={id} />
    </div>
  )
}

export const Route = createFileRoute('/clients/$clientId/payments')({
  component: ClientPaymentsRoute
})
