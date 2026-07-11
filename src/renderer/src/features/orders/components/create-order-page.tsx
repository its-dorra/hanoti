import * as React from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Plus, Trash2, ArrowRight } from 'lucide-react'
import { useCreateOrder } from '../hooks/use-create-order'
import { formatCurrency } from '../../../lib/utils'
import { ClientSearchSelect } from '../../clients/components/client-search-select'
import { ProductSearchSelect } from '../../products/components/product-search-select'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/card'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '../../../components/ui/table'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '../../../components/ui/select'
import type { Client } from '../../../../../shared/schemas/client.schema'
import type { Product } from '../../../../../shared/schemas/product.schema'
import { orpc } from '@renderer/integrations/orpc'

interface OrderLineItem {
  key: string
  product: Product
  quantity: number
  priceId?: number
  customUnitPrice?: number
  unitPrice: number
}

interface OrderDraft {
  clientId: number | undefined
  items: Array<{ productId: number; quantity: number; priceId?: number; customUnitPrice?: number }>
  depositAmount: number
}

type OrderDraftItem = OrderDraft['items'][number]

function createOrderLineItemKey(productId: number, index: number) {
  return `${productId}-${index}-${Date.now()}`
}

function resolveOrderLineItemUnitPrice(
  product: Product,
  priceId: number | undefined,
  customUnitPrice: number | undefined
) {
  if (customUnitPrice !== undefined) return customUnitPrice
  return product.prices.find((price) => price.id === priceId)?.amount
}

function resolveDraftItems(draft: OrderDraft, products: Product[]) {
  return draft.items.reduce<OrderLineItem[]>((resolved, draftItem) => {
    const product = products.find((candidate) => candidate.id === draftItem.productId)
    if (!product) return resolved

    const unitPrice = resolveOrderLineItemUnitPrice(
      product,
      draftItem.priceId,
      draftItem.customUnitPrice
    )
    if (unitPrice === undefined) return resolved

    resolved.push({
      key: createOrderLineItemKey(draftItem.productId, resolved.length),
      product,
      quantity: draftItem.quantity,
      priceId: draftItem.priceId,
      customUnitPrice: draftItem.customUnitPrice,
      unitPrice
    })
    return resolved
  }, [])
}

function serializeDraft(
  clientId: number | undefined,
  items: OrderLineItem[],
  depositAmount: number
): OrderDraft {
  return {
    clientId,
    items: items.map((item) => {
      const { product, quantity, priceId, customUnitPrice } = item
      return {
        productId: product.id,
        quantity,
        priceId,
        customUnitPrice
      } satisfies OrderDraftItem
    }),
    depositAmount
  }
}

function mapOrderItemsForSubmission(items: OrderLineItem[]) {
  return items.map((item) => ({
    productId: item.product.id,
    quantity: item.quantity,
    ...(item.customUnitPrice !== undefined
      ? { customUnitPrice: item.customUnitPrice }
      : { priceId: item.priceId! })
  }))
}

function useDraftPersistence({
  clientId,
  items,
  depositAmount
}: {
  clientId: number | undefined
  items: OrderLineItem[]
  depositAmount: number
}) {
  React.useEffect(() => {
    function persist() {
      saveDraft(serializeDraft(clientId, items, depositAmount))
    }

    const interval = setInterval(persist, 1000)

    return () => {
      clearInterval(interval)
      persist()
    }
  }, [clientId, items, depositAmount])
}

/**
 * Draft persistence — same rationale as before this was a full page:
 * nothing is written to the database until "إنشاء الطلب" is clicked, so
 * without this, navigating away (or closing the app) mid-edit loses
 * whatever had been added so far. Saved periodically while this page is
 * mounted, restored on next visit, cleared once the order is created.
 */
const DRAFT_STORAGE_KEY = 'grocery-app:order-draft'

function loadDraft(): OrderDraft | null {
  try {
    const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || !Array.isArray(parsed.items)) return null
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

interface CreateOrderPageProps {
  defaultClientId?: number
}

export function CreateOrderPage({ defaultClientId }: CreateOrderPageProps) {
  const navigate = useNavigate()
  const createOrder = useCreateOrder()

  const [initialDraft] = React.useState(() => loadDraft())
  const [draftNoticeVisible, setDraftNoticeVisible] = React.useState(Boolean(initialDraft))

  const [selectedClientOverride, setSelectedClientOverride] = React.useState<
    Client | null | undefined
  >()
  const [items, setItems] = React.useState<OrderLineItem[]>([])
  const [depositAmount, setDepositAmount] = React.useState(initialDraft?.depositAmount ?? 0)

  const selectedClientIdToResolve = initialDraft?.clientId ?? defaultClientId
  const selectedClient = selectedClientOverride === undefined ? undefined : selectedClientOverride

  // Resolve a pre-selected client (from the draft, or from ?clientId=...)
  // into a full Client object for display.
  const { data: resolvedClient } = useQuery({
    ...orpc.clients.getById.queryOptions({ input: { id: selectedClientIdToResolve ?? 0 } }),
    enabled: Boolean(selectedClientIdToResolve) && selectedClientOverride === undefined
  })
  const effectiveSelectedClient = selectedClient ?? resolvedClient

  // Resolve draft items (stored as bare productId + price refs) back into
  // full OrderLineItem objects once the product catalog is available.
  const draftAppliedRef = React.useRef(false)
  const { data: allProducts } = useQuery(
    orpc.products.list.queryOptions({ input: { query: '' }, enabled: Boolean(initialDraft) })
  )
  React.useEffect(() => {
    if (draftAppliedRef.current || !initialDraft || !allProducts) return
    const resolved = resolveDraftItems(initialDraft, allProducts)
    if (resolved.length > 0) {
      React.startTransition(() => {
        setItems(resolved)
      })
    }
    draftAppliedRef.current = true
  }, [initialDraft, allProducts])

  // ---- "Add item" sub-form state -----------------------------------------

  const [pendingProduct, setPendingProduct] = React.useState<Product | undefined>()
  const [pendingQuantity, setPendingQuantity] = React.useState(1)
  const [pendingPriceId, setPendingPriceId] = React.useState<number | undefined>()
  const [pendingUseCustomPrice, setPendingUseCustomPrice] = React.useState(false)
  const [pendingCustomPrice, setPendingCustomPrice] = React.useState(0)

  function resetPendingItem() {
    setPendingProduct(undefined)
    setPendingQuantity(1)
    setPendingPriceId(undefined)
    setPendingUseCustomPrice(false)
    setPendingCustomPrice(0)
  }

  const canAddPendingItem =
    Boolean(pendingProduct) &&
    pendingQuantity > 0 &&
    (pendingUseCustomPrice ? pendingCustomPrice >= 0 : pendingPriceId !== undefined)

  function handleAddItem() {
    if (!pendingProduct || !canAddPendingItem) return
    const unitPrice = pendingUseCustomPrice
      ? pendingCustomPrice
      : pendingProduct.prices.find((p) => p.id === pendingPriceId)?.amount
    if (unitPrice === undefined) return

    setItems((prev) => [
      ...prev,
      {
        key: `${pendingProduct.id}-${prev.length}-${Date.now()}`,
        product: pendingProduct,
        quantity: pendingQuantity,
        priceId: pendingUseCustomPrice ? undefined : pendingPriceId,
        customUnitPrice: pendingUseCustomPrice ? pendingCustomPrice : undefined,
        unitPrice
      }
    ])
    resetPendingItem()
  }

  function handleRemoveItem(key: string) {
    setItems((prev) => prev.filter((item) => item.key !== key))
  }

  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
  const canSubmitOrder = Boolean(effectiveSelectedClient) && items.length > 0

  useDraftPersistence({
    clientId: selectedClient?.id,
    items,
    depositAmount
  })

  async function handleSubmit() {
    if (!canSubmitOrder || !effectiveSelectedClient) return

    await createOrder.mutateAsync({
      clientId: effectiveSelectedClient.id,
      items: mapOrderItemsForSubmission(items),
      depositAmount
    })

    clearDraft()
    navigate({ to: '/clients/$clientId', params: { clientId: String(effectiveSelectedClient.id) } })
  }

  return (
    <div className="max-w-3xl space-y-6">
      <Link
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        to="/orders"
      >
        <ArrowRight className="h-4 w-4" />
        العودة إلى الطلبات
      </Link>

      <h1 className="text-2xl font-semibold">طلب جديد</h1>

      {draftNoticeVisible && (
        <p className="rounded-md bg-accent px-3 py-2 text-sm text-accent-foreground">
          تم استعادة طلب غير مكتمل من آخر جلسة عمل.{' '}
          <button type="button" className="underline" onClick={() => setDraftNoticeVisible(false)}>
            إخفاء
          </button>
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">العميل</CardTitle>
        </CardHeader>
        <CardContent>
          <ClientSearchSelect
            selectedClient={effectiveSelectedClient}
            onSelect={setSelectedClientOverride}
            onClear={() => setSelectedClientOverride(null)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">إضافة عنصر</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <ProductSearchSelect
            selectedProduct={pendingProduct}
            onSelect={(product) => {
              setPendingProduct(product)
              setPendingPriceId(product.prices[0]?.id)
              setPendingUseCustomPrice(false)
            }}
            onClear={resetPendingItem}
          />

          {pendingProduct && (
            <div className="grid grid-cols-12 items-end gap-2">
              <div className="col-span-2 space-y-1.5">
                <Label>الكمية</Label>
                <Input
                  type="number"
                  min={1}
                  value={pendingQuantity}
                  onChange={(e) => setPendingQuantity(Number(e.target.value))}
                />
              </div>

              {!pendingUseCustomPrice ? (
                <div className="col-span-5 space-y-1.5">
                  <Label>السعر</Label>
                  <Select
                    value={pendingPriceId ? String(pendingPriceId) : undefined}
                    onValueChange={(v) => setPendingPriceId(Number(v))}
                    disabled={pendingProduct.prices.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر السعر" />
                    </SelectTrigger>
                    <SelectContent>
                      {pendingProduct.prices.map((price) => (
                        <SelectItem key={price.id} value={String(price.id)}>
                          {formatCurrency(price.amount)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="col-span-5 space-y-1.5">
                  <Label>سعر مخصص</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={pendingCustomPrice}
                    onChange={(e) => setPendingCustomPrice(Number(e.target.value))}
                  />
                </div>
              )}

              <div className="col-span-3">
                <button
                  type="button"
                  className="text-xs text-muted-foreground underline"
                  onClick={() => setPendingUseCustomPrice((v) => !v)}
                >
                  {pendingUseCustomPrice ? 'استخدام قائمة الأسعار' : 'سعر مخصص'}
                </button>
              </div>

              <div className="col-span-2">
                <Button
                  type="button"
                  onClick={handleAddItem}
                  disabled={!canAddPendingItem}
                  className="w-full"
                >
                  <Plus className="h-4 w-4" />
                  إضافة
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">عناصر الطلب</CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              لم تتم إضافة أي عنصر بعد.
            </p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>المنتج</TableHead>
                    <TableHead>الكمية</TableHead>
                    <TableHead>سعر الوحدة</TableHead>
                    <TableHead>الإجمالي</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.key}>
                      <TableCell>{item.product.name}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                      <TableCell>{formatCurrency(item.unitPrice * item.quantity)}</TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveItem(item.key)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-3 text-end text-lg font-semibold">
                الإجمالي: {formatCurrency(subtotal)}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">الدفعة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-w-xs space-y-1.5">
            <Label htmlFor="depositAmount">المبلغ المودع (اختياري)</Label>
            <Input
              id="depositAmount"
              type="number"
              min={0}
              step="0.01"
              value={depositAmount}
              onChange={(e) => setDepositAmount(Math.max(0, Number(e.target.value)))}
            />
            <p className="text-xs text-muted-foreground">
              دفعة تُسجَّل بشكل مستقل عند إنشاء الطلب — ستُخصم من دين العميل تلقائيًا.
            </p>
          </div>
        </CardContent>
      </Card>

      {!canSubmitOrder && (
        <p className="text-sm text-destructive">
          {!effectiveSelectedClient && 'يجب اختيار عميل. '}
          {items.length === 0 && 'يجب إضافة عنصر واحد على الأقل قبل إنشاء الطلب.'}
        </p>
      )}

      <div className="flex justify-end gap-2 pb-6">
        <Button type="button" variant="outline" onClick={() => navigate({ to: '/orders' })}>
          إلغاء
        </Button>
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmitOrder || createOrder.isPending}
        >
          {createOrder.isPending ? 'جارٍ الإنشاء...' : 'إنشاء الطلب'}
        </Button>
      </div>
    </div>
  )
}
