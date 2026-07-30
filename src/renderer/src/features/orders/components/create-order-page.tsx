import * as React from 'react'
import { ArrowRight } from 'lucide-react'

import { useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import { Link } from '@tanstack/react-router'

import { useCreateOrder } from '../hooks/use-create-order'
import { printInvoice } from '../utils'

import type { OrderLineItem } from '../types'
import { clearDraft, mapOrderItemsForSubmission, resolveDraftItems } from '../utils'

import { useInitialOrderDraft, useOrderDraftPersistence } from '../hooks/use-order-draft'

import { AddOrderItemForm } from './add-order-item-form'
import { OrderDeposit } from './order-deposit'
import { OrderItemsTable } from './order-item-table'
import { Client } from 'src/shared/schemas/client.schema'
import { orpc } from '@renderer/integrations/orpc'
import { ClientSearchSelect } from '@renderer/features/clients/components/client-search-select'

interface CreateOrderPageProps {
  defaultClientId?: number
}

export function CreateOrderPage({ defaultClientId }: CreateOrderPageProps) {
  const navigate = useNavigate()
  const createOrder = useCreateOrder()

  const initialDraft = useInitialOrderDraft()

  const [selectedClientOverride, setSelectedClientOverride] = React.useState<
    Client | null | undefined
  >()

  const [items, setItems] = React.useState<OrderLineItem[]>([])

  const [depositAmount, setDepositAmount] = React.useState(initialDraft?.depositAmount ?? 0)

  const selectedClientId = initialDraft?.clientId ?? defaultClientId

  const { data: resolvedClient } = useQuery(
    orpc.clients.getById.queryOptions({
      input: {
        id: selectedClientId ?? 0
      },
      enabled: selectedClientId !== undefined && selectedClientOverride === undefined
    })
  )

  const selectedClient =
    selectedClientOverride === undefined ? resolvedClient : selectedClientOverride

  const { data: allProducts } = useQuery(
    orpc.products.list.queryOptions({
      input: {
        query: undefined
      },
      enabled: initialDraft !== null
    })
  )

  const draftAppliedRef = React.useRef(false)

  React.useEffect(() => {
    if (draftAppliedRef.current || !initialDraft || !allProducts) {
      return
    }

    setItems(resolveDraftItems(initialDraft, allProducts))

    draftAppliedRef.current = true
  }, [initialDraft, allProducts])

  useOrderDraftPersistence({
    clientId: selectedClient?.id,
    items,
    depositAmount
  })

  const subtotal = React.useMemo(
    () => items.reduce((total, item) => total + item.unitPrice * item.quantity, 0),
    [items]
  )

  const canSubmitOrder = selectedClient !== undefined && selectedClient !== null && items.length > 0

  const handleAddItem = React.useCallback((item: OrderLineItem) => {
    setItems((currentItems) => [...currentItems, item])
  }, [])

  const handleRemoveItem = React.useCallback((key: string) => {
    setItems((currentItems) => currentItems.filter((item) => item.key !== key))
  }, [])

  const handleSubmit = async () => {
    if (!canSubmitOrder || !selectedClient) {
      return
    }

    const order = await createOrder.mutateAsync({
      clientId: selectedClient.id,
      items: mapOrderItemsForSubmission(items),
      depositAmount
    })

    // Clear before navigation so the draft cannot be restored
    // if the destination page causes this page to mount again.
    clearDraft()

    setItems([])
    setDepositAmount(0)
    setSelectedClientOverride(null)

    await navigate({
      to: '/clients/$clientId',
      params: {
        clientId: String(selectedClient.id)
      }
    }).then(() => {
      printInvoice(order.id)
    })
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

      <section className="space-y-2">
        <h2 className="text-base">العميل</h2>

        <ClientSearchSelect
          selectedClient={selectedClient}
          onSelect={setSelectedClientOverride}
          onClear={() => setSelectedClientOverride(null)}
        />
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">إضافة عنصر</CardTitle>
        </CardHeader>

        <CardContent>
          <AddOrderItemForm onAdd={handleAddItem} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">عناصر الطلب</CardTitle>
        </CardHeader>

        <CardContent>
          <OrderItemsTable items={items} subtotal={subtotal} onRemove={handleRemoveItem} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">الدفعة</CardTitle>
        </CardHeader>

        <CardContent>
          <OrderDeposit value={depositAmount} onChange={setDepositAmount} />
        </CardContent>
      </Card>

      {!canSubmitOrder && (
        <p className="text-sm text-destructive">
          {!selectedClient && 'يجب اختيار عميل. '}

          {items.length === 0 && 'يجب إضافة عنصر واحد على الأقل قبل إنشاء الطلب.'}
        </p>
      )}

      <div className="flex justify-end gap-2 pb-6">
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            navigate({
              to: '/orders'
            })
          }
        >
          إلغاء
        </Button>

        <Button
          type="button"
          disabled={!canSubmitOrder || createOrder.isPending}
          onClick={handleSubmit}
        >
          {createOrder.isPending ? 'جارٍ الإنشاء...' : 'إنشاء الطلب'}
        </Button>
      </div>
    </div>
  )
}
