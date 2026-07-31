import { orpc } from '@renderer/integrations/orpc'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export function useRecordPayment() {
  const queryClient = useQueryClient()

  return useMutation(
    orpc.payments.record.mutationOptions({
      onSuccess: () => {
        // A payment changes both the payment history list and every
        // client's `debt` balance — invalidate both namespaces.
        queryClient.invalidateQueries({ queryKey: orpc.payments.key() })
        queryClient.invalidateQueries({ queryKey: orpc.clients.key() })
        queryClient.invalidateQueries({ queryKey: orpc.ledgers.key() })
      }
    })
  )
}
