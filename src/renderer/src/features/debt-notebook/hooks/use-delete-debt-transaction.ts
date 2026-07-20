import { orpc } from '@renderer/integrations/orpc'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export function useDeleteDebtTransaction() {
  const queryClient = useQueryClient()
  return useMutation(
    orpc.debtNotebook.deleteTransaction.mutationOptions({
      onSuccess: (data) => {
        queryClient.invalidateQueries({
          queryKey: orpc.debtNotebook.findByDebtEntryId.key({
            input: { debtEntryId: data.debtEntryId }
          })
        })
        queryClient.invalidateQueries({
          queryKey: orpc.debtNotebook.listTransactions.key({
            input: { debtEntryId: data.debtEntryId }
          })
        })
      }
    })
  )
}
