import { orpc } from '@renderer/integrations/orpc'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export function useCreateOrder() {
  const queryClient = useQueryClient()

  return useMutation(
    orpc.orders.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: orpc.orders.key() })
        queryClient.invalidateQueries({ queryKey: orpc.products.key() })
        queryClient.invalidateQueries({ queryKey: orpc.clients.key() })
        queryClient.invalidateQueries({ queryKey: orpc.ledgers.key() })
      }
    })
  )
}
