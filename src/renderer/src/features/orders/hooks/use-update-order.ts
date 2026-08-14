import { orpc } from '@renderer/integrations/orpc'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export function useUpdateOrder() {
  const queryClient = useQueryClient()

  return useMutation(
    orpc.orders.update.mutationOptions({
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: orpc.orders.key(), exact: false })
        queryClient.invalidateQueries({
          queryKey: orpc.orders.getById.key({ input: { id: data.id } })
        })
        queryClient.invalidateQueries({ queryKey: orpc.products.key() })
        queryClient.invalidateQueries({ queryKey: orpc.clients.key() })
        queryClient.invalidateQueries({
          queryKey: orpc.ledgers.listAll.key({ input: { clientId: data.clientId } })
        })
      }
    })
  )
}
