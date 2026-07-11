import { orpc } from '@renderer/integrations/orpc'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export function useCreateOrder() {
  const queryClient = useQueryClient()

  return useMutation(
    orpc.orders.create.mutationOptions({
      onSuccess: () => {
        // Router-level `.key()` invalidates every cached query under that
        // namespace (list, getById, ...) in one call — creating an order
        // affects the orders list, product stock levels, and every
        // client's debt balance, so we invalidate all three namespaces.
        queryClient.invalidateQueries({ queryKey: orpc.orders.key() })
        queryClient.invalidateQueries({ queryKey: orpc.products.key() })
        queryClient.invalidateQueries({ queryKey: orpc.clients.key() })
      }
    })
  )
}
