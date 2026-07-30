import { orpc } from '@renderer/integrations/orpc'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export const useDeletePayment = () => {
  const queryClient = useQueryClient()

  return useMutation(
    orpc.payments.delete.mutationOptions({
      onSuccess: () => {
        // A payment changes both the payment history list and every
        // client's `debt` balance — invalidate both namespaces.
        queryClient.invalidateQueries({ queryKey: orpc.payments.key() })
        queryClient.invalidateQueries({ queryKey: orpc.clients.key() })
      }
    })
  )
}
