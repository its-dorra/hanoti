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

interface RecordPaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clientId: number
}

/**
 * Records a standalone payment against the client's running debt balance.
 * Deliberately has no notion of "which order" — payments are independent
 * of orders entirely (see PaymentsService).
 */
export function RecordPaymentDialog({ open, onOpenChange, clientId }: RecordPaymentDialogProps) {
  const recordPayment = useRecordPayment()

  const form = useForm({
    defaultValues: {
      amount: 0,
      note: ''
    },
    onSubmit: async ({ value }) => {
      await recordPayment.mutateAsync({
        clientId,
        amount: value.amount,
        note: value.note || null
      })
      form.reset()
      onOpenChange(false)
    }
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>تسجيل دفعة</DialogTitle>
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
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            <Button type="submit" disabled={recordPayment.isPending}>
              {recordPayment.isPending ? 'جارٍ التسجيل...' : 'تسجيل الدفعة'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
