import { orpc } from '@renderer/integrations/orpc'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export default function useDeleteLastEntry() {
  const queryClient = useQueryClient()
  return useMutation(
    orpc.ledgers.deleteLastLedger.mutationOptions({
      onSuccess: (data) => {
        queryClient.invalidateQueries({
          queryKey: orpc.ledgers.listAll.key({ input: { clientId: data.clientId } })
        })
        queryClient.invalidateQueries({
          queryKey: orpc.clients.getById.key({ input: { id: data.clientId } })
        })
        data.referenceType === 'order' &&
          queryClient.invalidateQueries({
            queryKey: orpc.orders.list.key()
          })
      }
    })
  )
}
