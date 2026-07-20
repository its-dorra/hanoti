import { Dialog, DialogContent, DialogFooter } from '#components/ui/dialog'
import { Button } from '#components/ui/button'
import { useDeleteDebtTransaction } from '../hooks/use-delete-debt-transaction'

export default function DeleteTransactionDialog({
  transactionId,
  onClose
}: {
  transactionId: number | null
  onClose: () => void
}) {
  const deleteTransaction = useDeleteDebtTransaction()
  const open = transactionId !== null

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        console.log({ open })
        onClose()
      }}
    >
      <DialogContent>
        <h2 className="text-lg font-semibold">هل أنت متأكد من حذف هذا القيد؟</h2>
        <p className="text-sm text-muted-foreground">
          لا يمكن التراجع عن هذا الإجراء. سيتم حذف القيد نهائياً.
        </p>

        <DialogFooter>
          <Button
            disabled={deleteTransaction.isPending}
            variant="destructive"
            onClick={async () => {
              if (transactionId !== null) {
                await deleteTransaction.mutateAsync({ id: transactionId })
                onClose()
              }
            }}
          >
            <span>حذف</span>
          </Button>
          <Button onClick={() => onClose()}>غلق</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
