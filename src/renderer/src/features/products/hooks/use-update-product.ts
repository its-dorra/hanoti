import { orpc } from '@renderer/integrations/orpc'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export function useUpdateProduct() {
  const queryClient = useQueryClient()
  return useMutation(
    orpc.products.update.mutationOptions({
      onSuccess: () => queryClient.invalidateQueries({ queryKey: orpc.products.key() })
    })
  )
}
