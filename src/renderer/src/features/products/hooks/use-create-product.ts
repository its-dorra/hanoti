import { orpc } from '@renderer/integrations/orpc'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export function useCreateProduct() {
  const queryClient = useQueryClient()
  return useMutation(
    orpc.products.create.mutationOptions({
      onSuccess: () => queryClient.invalidateQueries({ queryKey: orpc.products.key() })
    })
  )
}
