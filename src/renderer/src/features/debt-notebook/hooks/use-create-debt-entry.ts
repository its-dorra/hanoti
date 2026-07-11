import { orpc } from '@renderer/integrations/orpc'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export function useCreateDebtEntry() {
  const queryClient = useQueryClient()
  return useMutation(
    orpc.debtNotebook.create.mutationOptions({
      onSuccess: () => queryClient.invalidateQueries({ queryKey: orpc.debtNotebook.key() })
    })
  )
}
