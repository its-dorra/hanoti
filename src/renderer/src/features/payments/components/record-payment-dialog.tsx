import { useForm } from '@tanstack/react-form'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '../../../components/ui/dialog'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { useRecordPayment } from '../hooks/use-record-payment'
import { Payment } from 'src/shared/schemas/payment.schema'
import { useUpdatePayment } from '../hooks/use-update-payment'

type RecordPaymentDialogProps =
  | { type: 'update'; payment: Payment; onClose: () => void }
  | {
      type: 'create'
      open: boolean
      onOpenChange: (open: boolean) => void
      clientId: number
    }

/**
 * Records a standalone payment against the client's running debt balance.
 * Deliberately has no notion of "which order" — payments are independent
 * of orders entirely (see PaymentsService).
 */
export function RecordPaymentDialog(props: RecordPaymentDialogProps) {
  const recordPayment = useRecordPayment()
  const updatePayment = useUpdatePayment()

  const form = useForm({
    defaultValues: {
      amount: props.type === 'update' ? props.payment.amount : 0,
      note: props.type === 'update' ? props.payment.note || '' : ''
    },
    onSubmit: async ({ value }) => {
      if (props.type === 'update') {
        await updatePayment.mutateAsync({
          paymentId: props.payment.id,
          data: {
            amount: value.amount,
            note: value.note || null,
            clientId: props.payment.clientId
          }
        })
      } else {
        await recordPayment.mutateAsync({
          clientId: props.clientId,
          amount: value.amount,
          note: value.note || null
        })
      }
      form.reset()
      if (props.type === 'update') {
        props.onClose()
      } else {
        props.onOpenChange(false)
      }
    }
  })

  return (
    <Dialog
      open={props.type === 'create' ? props.open : true}
      onOpenChange={props.type === 'create' ? props.onOpenChange : props.onClose}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{props.type === 'update' ? 'تعديل دفعة' : 'تسجيل دفعة'}</DialogTitle>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            form.handleSubmit()
          }}
        >
          <form.Field
            name="amount"
            validators={{
              onChange: ({ value }) => (value <= 0 ? 'يجب أن يكون المبلغ أكبر من 0' : undefined)
            }}
          >
            {(field) => (
              <div className="space-y-1.5">
                <Label htmlFor="amount">المبلغ</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(Number(e.target.value))}
                />
                {field.state.meta.errors.length > 0 && (
                  <p className="text-xs text-destructive">{field.state.meta.errors[0]}</p>
                )}
              </div>
            )}
          </form.Field>

          <form.Field name="note">
            {(field) => (
              <div className="space-y-1.5">
                <Label htmlFor="note">ملاحظة (اختياري)</Label>
                <Input
                  id="note"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              </div>
            )}
          </form.Field>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                props.type === 'create' ? props.onOpenChange(false) : props.onClose()
              }
            >
              إلغاء
            </Button>
            <Button type="submit" disabled={recordPayment.isPending}>
              {recordPayment.isPending
                ? 'جارٍ التسجيل...'
                : props.type === 'update'
                  ? 'تعديل الدفعة'
                  : 'تسجيل الدفعة'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
