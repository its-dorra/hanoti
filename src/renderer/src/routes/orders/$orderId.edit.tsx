import { createFileRoute } from '@tanstack/react-router'
import { EditOrderPage } from '@renderer/features/orders/components/edit-order-page'

export const Route = createFileRoute('/orders/$orderId/edit')({
  component: RouteComponent
})

function RouteComponent() {
  const { orderId } = Route.useParams()

  return <EditOrderPage orderId={Number(orderId)} />
}
