import { createFileRoute, useParams, Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { OrdersContainer } from '../../../features/orders/components/orders-container'

function ClientOrdersRoute() {
  const { clientId } = useParams({ from: '/clients/$clientId/orders' })
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
      <OrdersContainer clientId={id} />
    </div>
  )
}

export const Route = createFileRoute('/clients/$clientId/orders')({
  component: ClientOrdersRoute
})
