import { useForm } from '@tanstack/react-form'
import { useCreateDebtEntry } from '../hooks/use-create-debt-entry'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '#components/ui/dialog'
import { Label } from '#components/ui/label'
import { Input } from '#components/ui/input'
import { Button } from '#components/ui/button'

export default function NewEntryFormDialog({
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
