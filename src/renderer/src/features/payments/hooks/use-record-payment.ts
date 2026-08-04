import { orpc } from '@renderer/integrations/orpc'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export function useRecordPayment() {
  const queryClient = useQueryClient()

  return useMutation(
    orpc.payments.record.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: orpc.payments.key() })
        queryClient.invalidateQueries({ queryKey: orpc.clients.key() })
        queryClient.invalidateQueries({ queryKey: orpc.ledgers.key() })
      }
    })
  )
}
