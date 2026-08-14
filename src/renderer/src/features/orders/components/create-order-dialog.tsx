import * as React from 'react'
import { useForm } from '@tanstack/react-form'
import { useQuery } from '@tanstack/react-query'
import { Plus, Trash2 } from 'lucide-react'
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
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '../../../components/ui/select'
import { useCreateOrder } from '../hooks/use-create-order'
import { formatDZD } from '../../../lib/utils'
import { orpc } from '@renderer/integrations/orpc'

interface CreateOrderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Pre-selects a client when opened from that client's detail page. */
  defaultClientId?: number
}

interface LineItemForm {
  productId: number | undefined
  quantity: number
  priceId: number | undefined
  useCustomPrice: boolean
  customUnitPrice: number
}

interface OrderDraft {
  clientId: number | undefined
  lines: LineItemForm[]
  depositAmount: number
}

const emptyLine: LineItemForm = {
  productId: undefined,
  quantity: 1,
  priceId: undefined,
  useCustomPrice: false,
  customUnitPrice: 0
}

/**
 * In-progress orders are drafted here before they're ever sent to the
 * backend — nothing is written to the database until the cashier hits
 * "إنشاء الطلب". Without this, closing the app (or even just the dialog,
 * depending on how Radix mounts it) mid-edit would silently lose
 * whatever items had been added so far.
 *
 * `localStorage` is appropriate here (unlike in a Claude Artifact sandbox
 * — this is a real Electron renderer, backed by Chromium's persistent
 * storage for this app's own profile, and it already holds the theme
 * preference the same way). Saved periodically while the dialog is open,
 * restored on next mount, and cleared once the order is actually created.
 */
const DRAFT_STORAGE_KEY = 'grocery-app:order-draft'

function loadDraft(): OrderDraft | null {
  try {
    const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || !Array.isArray(parsed.lines) || parsed.lines.length === 0) return null
    return parsed as OrderDraft
  } catch {
    return null
  }
}

function saveDraft(draft: OrderDraft) {
  try {
    window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft))
  } catch {
    // Storage full/unavailable — draft persistence is a convenience,
    // never a reason to block order creation.
  }
}

function clearDraft() {
  window.localStorage.removeItem(DRAFT_STORAGE_KEY)
}

export function CreateOrderDialog({ open, onOpenChange, defaultClientId }: CreateOrderDialogProps) {
  // Read once per mount, not on every render — this seeds the form's
  // initial values below.
  const [initialDraft] = React.useState(() => loadDraft())

  // Queries called directly in the component, per the data-fetching rule.
  // Extra TanStack Query options (like `enabled`) merge directly into the
  // same `.queryOptions({...})` call alongside `input`.
  const { data: clients } = useQuery(
    orpc.clients.list.queryOptions({ input: { query: '' }, enabled: open })
  )
  const { data: products } = useQuery(
    orpc.products.list.queryOptions({ input: { query: '' }, enabled: open })
  )

  const createOrder = useCreateOrder()

  const form = useForm({
    defaultValues: {
      clientId: initialDraft?.clientId ?? defaultClientId,
      lines: initialDraft?.lines ?? ([{ ...emptyLine }] as LineItemForm[]),
      depositAmount: initialDraft?.depositAmount ?? 0
    },
    onSubmit: async ({ value }) => {
      // Defensive guards mirroring the submit button's disabled state
      // below — the button already prevents reaching here, but this
      // keeps the check correct even if that ever changes.
      if (!value.clientId) return
      const validItems = value.lines.filter((line) => line.productId && line.quantity > 0)
      if (validItems.length === 0) return

      await createOrder.mutateAsync({
        clientId: value.clientId,
        items: validItems.map((line) => ({
          productId: line.productId!,
          quantity: line.quantity,
          ...(line.useCustomPrice
            ? { customUnitPrice: line.customUnitPrice }
            : { priceId: line.priceId })
        })),
        depositAmount: value.depositAmount
      })

      clearDraft()
      form.reset({ clientId: defaultClientId, lines: [{ ...emptyLine }], depositAmount: 0 })
      onOpenChange(false)
    }
  })

  // Periodically persists the draft while the dialog is open, and once
  // more on close (covers both "dialog closed" and "app closed" — an app
  // quit doesn't fire a special React lifecycle event, so the interval is
  // what actually catches recent edits between ticks).
  React.useEffect(() => {
    if (!open) return
    const interval = setInterval(() => {
      saveDraft(form.state.values)
    }, 1000)
    return () => {
      clearInterval(interval)
      saveDraft(form.state.values)
    }
  }, [open, form])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>طلب جديد</DialogTitle>
        </DialogHeader>

        {initialDraft && (
          <p className="rounded-md bg-accent px-3 py-2 text-xs text-accent-foreground">
            تم استعادة طلب غير مكتمل من آخر جلسة عمل.
          </p>
        )}

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            form.handleSubmit()
          }}
        >
          <form.Field name="clientId">
            {(field) => (
              <div className="space-y-1.5">
                <Label>العميل</Label>
                <Select
                  value={field.state.value ? String(field.state.value) : undefined}
                  onValueChange={(v) => field.handleChange(Number(v))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر عميلاً" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients?.items.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </form.Field>

          <div className="space-y-2">
            <Label>العناصر</Label>
            <form.Field name="lines" mode="array">
              {(linesField) => (
                <div className="space-y-3">
                  {linesField.state.value.map((line, i) => {
                    const selectedProduct = products?.find((p) => p.id === line.productId)
                    return (
                      <div
                        key={i}
                        className="grid grid-cols-12 items-end gap-2 rounded-md border p-3"
                      >
                        <form.Field name={`lines[${i}].productId`}>
                          {(field) => (
                            <div className="col-span-4 space-y-1.5">
                              {i === 0 && <Label>المنتج</Label>}
                              <Select
                                value={field.state.value ? String(field.state.value) : undefined}
                                onValueChange={(v) => {
                                  field.handleChange(Number(v))
                                  form.setFieldValue(`lines[${i}].priceId`, undefined)
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="اختر منتجاً" />
                                </SelectTrigger>
                                <SelectContent>
                                  {products?.map((p) => (
                                    <SelectItem key={p.id} value={String(p.id)}>
                                      {p.name} ({p.quantity} بالمخزون)
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                        </form.Field>

                        <form.Field name={`lines[${i}].quantity`}>
                          {(field) => (
                            <div className="col-span-2 space-y-1.5">
                              {i === 0 && <Label>الكمية</Label>}
                              <Input
                                type="number"
                                min={1}
                                value={field.state.value}
                                onChange={(e) => field.handleChange(Number(e.target.value))}
                              />
                            </div>
                          )}
                        </form.Field>

                        <form.Field name={`lines[${i}].useCustomPrice`}>
                          {(useCustomField) => (
                            <>
                              {!useCustomField.state.value ? (
                                <form.Field name={`lines[${i}].priceId`}>
                                  {(priceField) => (
                                    <div className="col-span-4 space-y-1.5">
                                      {i === 0 && <Label>فئة السعر</Label>}
                                      <Select
                                        value={
                                          priceField.state.value
                                            ? String(priceField.state.value)
                                            : undefined
                                        }
                                        onValueChange={(v) => priceField.handleChange(Number(v))}
                                        disabled={!selectedProduct}
                                      >
                                        <SelectTrigger>
                                          <SelectValue placeholder="اختر السعر" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {selectedProduct?.prices.map((price) => (
                                            <SelectItem key={price.id} value={String(price.id)}>
                                              {formatDZD(price.amount)}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  )}
                                </form.Field>
                              ) : (
                                <form.Field name={`lines[${i}].customUnitPrice`}>
                                  {(customField) => (
                                    <div className="col-span-4 space-y-1.5">
                                      {i === 0 && <Label>سعر مخصص</Label>}
                                      <Input
                                        type="number"
                                        step="0.01"
                                        value={customField.state.value}
                                        onChange={(e) =>
                                          customField.handleChange(Number(e.target.value))
                                        }
                                      />
                                    </div>
                                  )}
                                </form.Field>
                              )}
                              <div className="col-span-1 flex items-center">
                                <button
                                  type="button"
                                  className="text-xs text-muted-foreground underline"
                                  onClick={() =>
                                    useCustomField.handleChange(!useCustomField.state.value)
                                  }
                                >
                                  {useCustomField.state.value ? 'استخدام الفئة' : 'سعر مخصص'}
                                </button>
                              </div>
                            </>
                          )}
                        </form.Field>

                        <div className="col-span-1 flex items-center justify-end">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            disabled={linesField.state.value.length === 1}
                            onClick={() => linesField.removeValue(i)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => linesField.pushValue({ ...emptyLine })}
                  >
                    <Plus className="h-4 w-4" />
                    إضافة عنصر
                  </Button>
                </div>
              )}
            </form.Field>
          </div>

          <form.Field name="depositAmount">
            {(field) => (
              <div className="space-y-1.5">
                <Label htmlFor="depositAmount">المبلغ المودع (اختياري)</Label>
                <Input
                  id="depositAmount"
                  type="number"
                  min={0}
                  step="0.01"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(Math.max(0, Number(e.target.value)))}
                />
                <p className="text-xs text-muted-foreground">
                  دفعة تُسجَّل بشكل مستقل عند إنشاء الطلب — ستُخصم من دين العميل تلقائيًا.
                </p>
              </div>
            )}
          </form.Field>

          {/* Reactively disables submission for an empty order (no client
              chosen, or not a single line item with a product selected) —
              this is the frontend block requested, mirrored by the
              defensive check in onSubmit above and by the backend's own
              EmptyOrderError either way. */}
          <form.Subscribe
            selector={(state) => [state.values.clientId, state.values.lines] as const}
          >
            {([clientId, lines]) => {
              const hasValidItem = lines.some((line) => line.productId && line.quantity > 0)
              const canSubmit = Boolean(clientId) && hasValidItem
              return (
                <>
                  {!hasValidItem && (
                    <p className="text-xs text-destructive">
                      يجب إضافة عنصر واحد على الأقل قبل إنشاء الطلب.
                    </p>
                  )}
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                      إلغاء
                    </Button>
                    <Button type="submit" disabled={!canSubmit || createOrder.isPending}>
                      {createOrder.isPending ? 'جارٍ الإنشاء...' : 'إنشاء الطلب'}
                    </Button>
                  </DialogFooter>
                </>
              )
            }}
          </form.Subscribe>
        </form>
      </DialogContent>
    </Dialog>
  )
}
