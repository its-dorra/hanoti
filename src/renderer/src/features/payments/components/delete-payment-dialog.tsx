import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '#components/ui/dialog'
import { Payment } from 'src/shared/schemas/payment.schema'
import { useDeletePayment } from '../hooks/use-delete-payment'
import { Button } from '#components/ui/button'

interface DeletePaymentDialogProps {
  payment: Payment
  onClose: () => void
}

export default function DeletePaymentDialog({
  payment,

  onClose
}: DeletePaymentDialogProps) {
  const deletePayment = useDeletePayment()

  return (
    <Dialog defaultOpen onOpenChange={onClose}>
      <DialogHeader>
        <DialogTitle>حذف الدفعة</DialogTitle>
      </DialogHeader>
      <DialogContent>
        <p>هل أنت متأكد من رغبتك في حذف هذه الدفعة؟</p>
        <DialogFooter></DialogFooter>
        <Button
          variant="destructive"
          disabled={deletePayment.isPending}
          onClick={async () => {
            await deletePayment.mutateAsync({ paymentId: payment.id })
            onClose()
          }}
        >
          حذف الدفعة
        </Button>
      </DialogContent>
    </Dialog>
  )
}
