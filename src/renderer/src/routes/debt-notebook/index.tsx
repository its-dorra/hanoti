import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useForm } from '@tanstack/react-form'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Skeleton } from '../../components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '../../components/ui/dialog'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '../../components/ui/select'
import { Plus } from 'lucide-react'
import { formatCurrency } from '../../lib/utils'
import { useCreateDebtEntry } from '../../features/debt-notebook/hooks/use-create-debt-entry'
import { useAddDebtTransaction } from '../../features/debt-notebook/hooks/use-add-debt-transaction'
import { orpc } from '@renderer/integrations/orpc'
import z from 'zod'

function DebtNotebookPage() {
  const [newEntryOpen, setNewEntryOpen] = React.useState(false)
  const [transactionEntryId, setTransactionEntryId] = React.useState<number | null>(null)
  const { type } = Route.useSearch()

  const { data: entries, isLoading } = useQuery(orpc.debtNotebook.list.queryOptions())

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">دفتر الديون</h1>
          <p className="text-muted-foreground">
            سجل بسيط ومنفصل للديون غير الرسمية — غير مرتبط بعملاء المتجر.
          </p>
        </div>
        <Button onClick={() => setNewEntryOpen(true)}>
          <Plus className="h-4 w-4" />
          قيد جديد
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)
        ) : entries?.length ? (
          entries.map((entry) => (
            <Card key={entry.id}>
              <CardHeader>
                <CardTitle>{entry.clientName}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className={`text-lg font-semibold ${entry.debt > 0 ? 'text-destructive' : ''}`}>
                  {formatCurrency(entry.debt)}
                </p>

                <Button variant="outline" size="sm" onClick={() => setTransactionEntryId(entry.id)}>
                  إضافة إيداع / دين
                </Button>
              </CardContent>
            </Card>
          ))
        ) : (
          <p className="text-muted-foreground">لا توجد قيود ديون بعد.</p>
        )}
      </div>

      <NewEntryFormDialog open={newEntryOpen} setOpen={setNewEntryOpen} type={type} />

      <AddTransactionDialog
        debtEntryId={transactionEntryId}
        onOpenChange={(open) => !open && setTransactionEntryId(null)}
      />
    </div>
  )
}

function AddTransactionDialog({
  debtEntryId,
  onOpenChange
}: {
  debtEntryId: number | null
  onOpenChange: (open: boolean) => void
}) {
  const addTransaction = useAddDebtTransaction()

  const form = useForm({
    defaultValues: { type: 'deposit' as 'deposit' | 'charge', amount: 0, note: '' },
    onSubmit: async ({ value }) => {
      if (!debtEntryId) return
      await addTransaction.mutateAsync({ debtEntryId, ...value, note: value.note || null })
      form.reset()
      onOpenChange(false)
    }
  })

  return (
    <Dialog open={debtEntryId !== null} onOpenChange={onOpenChange}>
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
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
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

function NewEntryFormDialog({
  open,
  setOpen,
  type
}: {
  open: boolean
  setOpen: (open: boolean) => void
  type: 'buyer' | 'seller'
}) {
  const createEntry = useCreateDebtEntry()

  const newEntryForm = useForm({
    defaultValues: { clientName: '', debt: 0 },
    onSubmit: async ({ value }) => {
      await createEntry.mutateAsync({ ...value, type })
      newEntryForm.reset()
      setOpen(false)
    }
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>قيد دين جديد</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            newEntryForm.handleSubmit()
          }}
        >
          <newEntryForm.Field name="clientName">
            {(field) => (
              <div className="space-y-1.5">
                <Label htmlFor="clientName">الاسم</Label>
                <Input
                  id="clientName"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              </div>
            )}
          </newEntryForm.Field>
          <newEntryForm.Field name="debt">
            {(field) => (
              <div className="space-y-1.5">
                <Label htmlFor="debt">الدين</Label>
                <Input
                  id="debt"
                  type="number"
                  step="0.01"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(Number(e.target.value))}
                />
              </div>
            )}
          </newEntryForm.Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              إلغاء
            </Button>
            <Button type="submit" disabled={createEntry.isPending}>
              {createEntry.isPending ? 'جارٍ الحفظ...' : 'إنشاء'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export const Route = createFileRoute('/debt-notebook/')({
  validateSearch: z.object({
    type: z.enum(['buyer', 'seller']).default('buyer')
  }),
  component: DebtNotebookPage
})
