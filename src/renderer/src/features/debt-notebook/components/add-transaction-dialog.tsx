import { useAddDebtTransaction } from '../hooks/use-add-debt-transaction'
import { useForm } from '@tanstack/react-form'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '#components/ui/dialog'
import { Button } from '#components/ui/button'
import { Plus } from 'lucide-react'
import { Label } from '#components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '#components/ui/select'
import { Input } from '#components/ui/input'
import { useState } from 'react'

type AddTransactionDialog = { debtEntryId: number }

export default function AddTransactionDialog({ debtEntryId }: AddTransactionDialog) {
  const addTransaction = useAddDebtTransaction()

  const [open, setOpen] = useState(false)

  const form = useForm({
    defaultValues: { type: 'deposit' as 'deposit' | 'charge', amount: '' as '' | number, note: '' },
    onSubmit: async ({ value }) => {
      await addTransaction.mutateAsync({
        debtEntryId,
        ...value,
        amount: Number(value.amount),
        note: value.note || null
      })
      form.reset()
      setOpen(false)
    }
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" />
          قيد جديد
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>إضافة إيداع / دين</DialogTitle>
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
                  onChange={(e) =>
                    field.handleChange(e.target.value === '' ? '' : Number(e.target.value))
                  }
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
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              إلغاء
            </Button>
            <Button type="submit" disabled={addTransaction.isPending}>
              {addTransaction.isPending ? 'جارٍ الحفظ...' : 'حفظ'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
