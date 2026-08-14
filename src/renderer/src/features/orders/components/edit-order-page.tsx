import * as React from 'react'
import { ArrowRight, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useNavigate, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDZD } from '@/lib/utils'

import { useUpdateOrder } from '../hooks/use-update-order'
import type { OrderLineItem } from '../types'
import { createOrderLineItemKey, mapOrderItemsForSubmission } from '../utils'
import { AddOrderItemForm } from './add-order-item-form'
import { OrderItemsTable } from './order-item-table'
import { orpc } from '@renderer/integrations/orpc'
import { printInvoice } from '@renderer/features/ledgers/utils'
import type { Product } from '../../../../../shared/schemas/product.schema'

interface EditOrderPageProps {
  orderId: number
}

export function EditOrderPage({ orderId }: EditOrderPageProps) {
  const navigate = useNavigate()
  const updateOrder = useUpdateOrder()

  const [items, setItems] = React.useState<OrderLineItem[]>([])
  const initializedRef = React.useRef(false)

  const {
    data: order,
    isLoading: isLoadingOrder,
    isError: isOrderError
  } = useQuery(
    orpc.orders.getById.queryOptions({
      input: { id: orderId }
    })
  )

  const { data: allProducts, isLoading: isLoadingProducts } = useQuery(
    orpc.products.list.queryOptions({
      input: { query: undefined }
    })
  )

  const { data: client } = useQuery(
    orpc.clients.getById.queryOptions({
      input: { id: order?.clientId ?? 0 },
      enabled: !!order?.clientId
    })
  )

  React.useEffect(() => {
    if (initializedRef.current || !order || !allProducts) {
      return
    }

    const productsById = new Map<number, Product>(
      allProducts.map((product) => [product.id, product])
    )

    const initialItems: OrderLineItem[] = order.items.map((orderItem) => {
      const product = productsById.get(orderItem.productId) ?? {
        id: orderItem.productId,
        name: orderItem.productNameSnapshot,
        buyingPrice: 0,
        quantity: 0,
        prices: [{ id: 0, productId: orderItem.productId, amount: orderItem.unitPrice }],
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const matchedPrice = product.prices.find((p) => p.amount === orderItem.unitPrice)
      const priceId = matchedPrice?.id !== 0 ? matchedPrice?.id : undefined
      const customUnitPrice = priceId !== undefined ? undefined : orderItem.unitPrice

      return {
        key: createOrderLineItemKey(),
        product,
        productNameSnapshot: orderItem.productNameSnapshot,
        quantity: orderItem.quantity,
        priceId,
        customUnitPrice,
        unitPrice: orderItem.unitPrice
      }
    })

    setItems(initialItems)
    initializedRef.current = true
  }, [order, allProducts])

  const handleAddItem = React.useCallback((item: OrderLineItem) => {
    setItems((currentItems) => [...currentItems, item])
  }, [])

  const handleRemoveItem = React.useCallback((key: string) => {
    setItems((currentItems) => currentItems.filter((item) => item.key !== key))
  }, [])

  const oldSubtotal = order?.subtotal ?? 0
  const newSubtotal = React.useMemo(
    () => items.reduce((total, item) => total + item.unitPrice * item.quantity, 0),
    [items]
  )
  const delta = newSubtotal - oldSubtotal
  const currentClientBalance = client?.balance ?? 0
  const projectedClientBalance = currentClientBalance + delta

  const canSubmit = items.length > 0 && !updateOrder.isPending

  const handleSubmit = async () => {
    if (!canSubmit || !order) {
      return
    }

    const updated = await updateOrder.mutateAsync({
      id: order.id,
      items: mapOrderItemsForSubmission(items)
    })

    await navigate({
      to: '/clients/$clientId',
      params: {
        clientId: String(order.clientId)
      }
    }).then(() => {
      printInvoice(updated.id, updated.orderDate)
    })
  }

  if (isLoadingOrder || isLoadingProducts) {
    return (
      <div className="max-w-3xl space-y-6">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  if (isOrderError || !order) {
    return (
      <div className="max-w-3xl space-y-4">
        <Link
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          to="/orders"
        >
          <ArrowRight className="h-4 w-4" />
          العودة إلى الطلبات
        </Link>
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            <span className="font-semibold">خطأ: تعذر العثور على الطلب</span>
          </div>
          <p className="mt-1 text-sm">الطلب المطلوب غير موجود أو تم حذفه.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <Link
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          to="/clients/$clientId"
          params={{ clientId: String(order.clientId) }}
        >
          <ArrowRight className="h-4 w-4" />
          العودة إلى الزبون ({order.clientName})
        </Link>
      </div>

      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">تعديل الطلب #{order.id}</h1>
        <p className="text-sm text-muted-foreground">
          تاريخ الطلب: {new Date(order.orderDate).toLocaleDateString('fr')} -{' '}
          {new Date(order.orderDate).toLocaleTimeString('fr')}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">معلومات العميل وتأثير التعديل</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <span className="text-xs text-muted-foreground">العميل</span>
              <p className="font-semibold">{order.clientName}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">المبلغ الأصلي للفاتورة</span>
              <p className="font-semibold">{formatDZD(oldSubtotal)}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">المبلغ الجديد للفاتورة</span>
              <p className="font-semibold">{formatDZD(newSubtotal)}</p>
            </div>
          </div>

          <div className="rounded-md border p-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="text-muted-foreground">تأثير التعديل على دفتر ديون العميل:</span>
              <div className="flex items-center gap-3">
                <span>
                  الدين الحالي:{' '}
                  <span className="font-semibold">{formatDZD(currentClientBalance)}</span>
                </span>
                <span className="text-muted-foreground">←</span>
                <span>
                  الدين بعد التعديل:{' '}
                  <span
                    className={
                      delta > 0
                        ? 'font-bold text-destructive'
                        : delta < 0
                          ? 'font-bold text-emerald-600 dark:text-emerald-400'
                          : 'font-semibold'
                    }
                  >
                    {formatDZD(projectedClientBalance)}
                  </span>
                </span>
                {delta !== 0 && (
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-semibold ${
                      delta > 0
                        ? 'bg-destructive/10 text-destructive'
                        : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    {delta > 0 ? `+${formatDZD(delta)}` : formatDZD(delta)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">إضافة عنصر</CardTitle>
        </CardHeader>
        <CardContent>
          <AddOrderItemForm items={items} onAdd={handleAddItem} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">عناصر الطلب</CardTitle>
        </CardHeader>
        <CardContent>
          <OrderItemsTable items={items} subtotal={newSubtotal} onRemove={handleRemoveItem} />
        </CardContent>
      </Card>

      {items.length === 0 && (
        <p className="text-sm text-destructive">
          يجب إضافة عنصر واحد على الأقل قبل حفظ التعديلات.
        </p>
      )}

      <div className="flex justify-end gap-2 pb-6">
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            navigate({
              to: '/clients/$clientId',
              params: {
                clientId: String(order.clientId)
              }
            })
          }
        >
          إلغاء
        </Button>

        <Button
          type="button"
          disabled={!canSubmit || updateOrder.isPending}
          onClick={handleSubmit}
        >
          {updateOrder.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              جارٍ الحفظ...
            </>
          ) : (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              حفظ التعديلات
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
