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
import { Plus, Trash2 } from 'lucide-react'
import { useCreateProduct } from '../hooks/use-create-product'
import { useUpdateProduct } from '../hooks/use-update-product'
import type { Product } from '../../../../../shared/schemas/product.schema'

interface ProductFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product?: Product
}

export function ProductFormDialog({ open, onOpenChange, product }: ProductFormDialogProps) {
  const createProduct = useCreateProduct()
  const updateProduct = useUpdateProduct()
  const isEditing = Boolean(product)

  const form = useForm({
    defaultValues: {
      name: product?.name ?? '',
      buyingPrice: product?.buyingPrice ?? 0,
      quantity: product?.quantity ?? 0,
      prices: product?.prices.map((p) => ({ amount: p.amount })) ?? [{ amount: 0 }]
    },
    onSubmit: async ({ value }) => {
      if (isEditing && product) {
        await updateProduct.mutateAsync({ id: product.id, ...value })
      } else {
        await createProduct.mutateAsync(value)
      }
      onOpenChange(false)
    }
  })

  const isPending = createProduct.isPending || updateProduct.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'تعديل المنتج' : 'منتج جديد'}</DialogTitle>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            form.handleSubmit()
          }}
        >
          <div className="grid grid-cols-3 gap-3">
            <form.Field
              name="name"
              validators={{ onChange: ({ value }) => (!value.trim() ? 'مطلوب' : undefined) }}
            >
              {(field) => (
                <div className="col-span-3 space-y-1.5">
                  <Label htmlFor="name">الاسم</Label>
                  <Input
                    id="name"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  {field.state.meta.errors.length > 0 && (
                    <p className="text-xs text-destructive">{field.state.meta.errors[0]}</p>
                  )}
                </div>
              )}
            </form.Field>

            <form.Field name="buyingPrice">
              {(field) => (
                <div className="space-y-1.5">
                  <Label htmlFor="buyingPrice">سعر الشراء</Label>
                  <Input
                    id="buyingPrice"
                    type="number"
                    step="0.01"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(Number(e.target.value))}
                  />
                </div>
              )}
            </form.Field>

            <form.Field name="quantity">
              {(field) => (
                <div className="space-y-1.5">
                  <Label htmlFor="quantity">كمية المخزون</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min={0}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(Math.max(0, Number(e.target.value)))}
                  />
                </div>
              )}
            </form.Field>
          </div>

          <div className="space-y-2">
            <Label>أسعار البيع</Label>
            <form.Field name="prices" mode="array">
              {(field) => (
                <div className="space-y-2">
                  {field.state.value.map((_, i) => (
                    <div key={i} className="flex items-end gap-2">
                      <form.Field name={`prices[${i}].amount`}>
                        {(subField) => (
                          <div className="flex-1 space-y-1.5">
                            {i === 0 && <Label>المبلغ</Label>}
                            <Input
                              type="number"
                              step="0.01"
                              value={subField.state.value}
                              onChange={(e) => subField.handleChange(Number(e.target.value))}
                            />
                          </div>
                        )}
                      </form.Field>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={field.state.value.length === 1}
                        onClick={() => field.removeValue(i)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => field.pushValue({ amount: 0 })}
                  >
                    <Plus className="h-4 w-4" />
                    إضافة فئة سعر
                  </Button>
                </div>
              )}
            </form.Field>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'جارٍ الحفظ...' : isEditing ? 'حفظ التغييرات' : 'إنشاء منتج'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
