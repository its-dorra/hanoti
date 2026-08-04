import { orpc } from '@renderer/integrations/orpc'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export function useAddDebtTransaction() {
  const queryClient = useQueryClient()
  return useMutation(
    orpc.debtNotebook.addTransaction.mutationOptions({
      onSuccess: (_, vars) => {
        queryClient.invalidateQueries({
          queryKey: orpc.debtNotebook.findByDebtEntryId.key({
            input: { debtEntryId: vars.debtEntryId }
          })
        })
        queryClient.invalidateQueries({
          queryKey: orpc.debtNotebook.listTransactions.key({
            input: { debtEntryId: vars.debtEntryId }
          })
        })

        queryClient.invalidateQueries({
          queryKey: orpc.debtNotebook.list.key()
        })
      }
    })
  )
}
