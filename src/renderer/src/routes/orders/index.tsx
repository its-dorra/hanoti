import { OrdersContainer } from '../../features/orders/components/orders-container'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/orders/')({
  component: OrdersContainer
})
