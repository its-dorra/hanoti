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
import { useCreateClient } from '../hooks/use-create-client'
import { useUpdateClient } from '../hooks/use-update-client'
import type { Client } from '../../../../../shared/schemas/client.schema'

interface ClientFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Present when editing; absent when creating. */
  client?: Client
}

export function ClientFormDialog({ open, onOpenChange, client }: ClientFormDialogProps) {
  const createClient = useCreateClient()
  const updateClient = useUpdateClient()
  const isEditing = Boolean(client)

  const form = useForm({
    defaultValues: {
      name: client?.name ?? '',
      phone: client?.phone ?? '',
      notes: client?.notes ?? '',
      balance: client?.balance ?? ''
    },
    onSubmit: async ({ value, formApi }) => {
      const payload = {
        name: value.name,
        phone: value.phone || null,
        notes: value.notes || null,
        balance: value.balance || 0
      }

      if (isEditing && client) {
        await updateClient.mutateAsync({
          id: client.id,
          ...payload,
          balance: payload.balance === '' ? 0 : +payload.balance
        })
      } else {
        await createClient.mutateAsync({
          ...payload,
          balance: value.balance === '' ? 0 : +value.balance
        })
      }
      onOpenChange(false)
      formApi.reset()
    }
  })

  const isPending = createClient.isPending || updateClient.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'تعديل العميل' : 'عميل جديد'}</DialogTitle>
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
            name="name"
            validators={{
              onChange: ({ value }) => (!value.trim() ? 'الاسم مطلوب' : undefined)
            }}
          >
            {(field) => (
              <div className="space-y-1.5">
                <Label htmlFor="name">الاسم</Label>
                <Input
                  id="name"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                />
                {field.state.meta.errors.length > 0 && (
                  <p className="text-xs text-destructive">{field.state.meta.errors[0]}</p>
                )}
              </div>
            )}
          </form.Field>

          <form.Field name="phone">
            {(field) => (
              <div className="space-y-1.5">
                <Label htmlFor="phone">الهاتف</Label>
                <Input
                  id="phone"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              </div>
            )}
          </form.Field>

          <form.Field name="notes">
            {(field) => (
              <div className="space-y-1.5">
                <Label htmlFor="notes">ملاحظات</Label>
                <Input
                  id="notes"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              </div>
            )}
          </form.Field>

          <form.Field name="balance">
            {(field) => (
              <div className="space-y-1.5">
                <Label htmlFor="balance">الدين السابق</Label>
                <Input
                  id="balance"
                  type="number"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value === '' ? '' : +e.target.value)}
                />
              </div>
            )}
          </form.Field>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'جارٍ الحفظ...' : isEditing ? 'حفظ التغييرات' : 'إنشاء عميل'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
