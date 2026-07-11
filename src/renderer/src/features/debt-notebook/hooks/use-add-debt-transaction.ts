import { orpc } from '@renderer/integrations/orpc'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export function useAddDebtTransaction() {
  const queryClient = useQueryClient()
  return useMutation(
    orpc.debtNotebook.addTransaction.mutationOptions({
      onSuccess: () => queryClient.invalidateQueries({ queryKey: orpc.debtNotebook.key() })
    })
  )
}
