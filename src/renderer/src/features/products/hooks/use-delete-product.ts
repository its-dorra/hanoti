import { orpc } from '@renderer/integrations/orpc'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export function useDeleteProduct() {
  const queryClient = useQueryClient()
  return useMutation(
    orpc.products.delete.mutationOptions({
      onSuccess: () => queryClient.invalidateQueries({ queryKey: orpc.products.key() })
    })
  )
}
