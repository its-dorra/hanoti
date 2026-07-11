import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { CreateOrderPage } from '@renderer/features/orders/components/create-order-page'

const searchSchema = z.object({
  clientId: z.number().int().positive().optional()
})

export const Route = createFileRoute('/orders/new')({
  validateSearch: searchSchema,
  component: RouteComponent
})

function RouteComponent() {
  const { clientId } = Route.useSearch()

  return <CreateOrderPage defaultClientId={clientId} />
}
