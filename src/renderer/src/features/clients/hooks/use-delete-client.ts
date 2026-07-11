import { orpc } from '@renderer/integrations/orpc'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export function useDeleteClient() {
  const queryClient = useQueryClient()

  return useMutation(
    orpc.clients.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: orpc.clients.key() })
      }
    })
  )
}
