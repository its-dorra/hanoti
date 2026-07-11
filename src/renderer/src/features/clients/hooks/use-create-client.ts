import { orpc } from '@renderer/integrations/orpc'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export function useCreateClient() {
  const queryClient = useQueryClient()

  return useMutation(
    orpc.clients.create.mutationOptions({
      onSuccess: () => {
        // Invalidates every cached query under `clients` (list, getById,
        // getBalance, ...) via the router-level key, rather than an
        // ad-hoc, hand-typed queryKey array.
        queryClient.invalidateQueries({ queryKey: orpc.clients.key() })
      }
    })
  )
}
