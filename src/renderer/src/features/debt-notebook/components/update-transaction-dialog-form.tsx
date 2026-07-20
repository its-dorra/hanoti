import { useForm } from '@tanstack/react-form'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '#components/ui/dialog'
import { Button } from '#components/ui/button'
import { Label } from '#components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '#components/ui/select'
import { Input } from '#components/ui/input'
import { useUpdateDebtTransaction } from '../hooks/use-update-debt-transaction'
import { Transaction } from '../types'

export default function UpdateTransactionDialog({
  transaction,
  onClose
}: {
  onClose: () => void
  transaction: Transaction | null
}) {
  const updateTransaction = useUpdateDebtTransaction()
  const open = transaction !== null

  const form = useForm({
    defaultValues: {
      type: transaction?.type || ('deposit' as 'deposit' | 'charge'),
      amount: transaction?.amount || 0,
      note: transaction?.note || ''
    },
    onSubmit: async ({ value }) => {
      if (!transaction) return
      await updateTransaction.mutateAsync({
        transactionId: transaction.id,
        input: { ...value, note: value.note || null }
      })
      form.reset()
      onClose()
    }
  })

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>تعديل القيد</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            form.handleSubmit()
          }}
        >
          <form.Field name="type">
            {(field) => (
              <div className="space-y-1.5">
                <Label>النوع</Label>
                <Select
                  value={field.state.value}
                  onValueChange={(v) => field.handleChange(v as 'deposit' | 'charge')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="deposit">إيداع (يقلل الدين)</SelectItem>
                    <SelectItem value="charge">دين (يزيد الدين)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </form.Field>
          <form.Field name="amount">
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
            <Button type="button" variant="outline" onClick={() => onClose()}>
              إلغاء
            </Button>
            <Button type="submit" disabled={updateTransaction.isPending}>
              {updateTransaction.isPending ? 'جارٍ الحفظ...' : 'حفظ'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
