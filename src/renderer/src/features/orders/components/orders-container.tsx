import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { OrdersPresenter, type OrderStatusFilter } from './orders-presenter'
import type { Order } from '../../../../../shared/schemas/order.schema'
import { orpc } from '@renderer/integrations/orpc'

interface OrdersContainerProps {
  /** When set (e.g. embedded on a client's own orders page), filters to that client and hides the name search. */
  clientId?: number
}

export function OrdersContainer({ clientId }: OrdersContainerProps) {
  const [clientNameQuery, setClientNameQuery] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState<OrderStatusFilter>('all')
  const [dateFrom, setDateFrom] = React.useState('')
  const [dateTo, setDateTo] = React.useState('')

  // Fetched once regardless of scope: builds the clientId -> name map used
  // to show real names in the table, and (on the unscoped /orders page)
  // doubles as the source for the "search by client name" filter — no
  // backend join/aggregation needed for either.
  const { data: clients } = useQuery(orpc.clients.list.queryOptions({ input: { query: '' } }))
  const clientNameById = React.useMemo(
    () => new Map((clients ?? []).map((c) => [c.id, c.name])),
    [clients]
  )

  const {
    data: orders,
    isLoading,
    isError
  } = useQuery(
    orpc.orders.list.queryOptions({
      input: {
        clientId,
        status: statusFilter === 'all' ? undefined : statusFilter,
        dateFrom: dateFrom ? new Date(dateFrom) : undefined,
        dateTo: dateTo ? new Date(dateTo) : undefined
      }
    })
  )

  const filteredOrders = React.useMemo(() => {
    if (!orders) return []
    const trimmedQuery = clientNameQuery.trim().toLowerCase()
    if (!trimmedQuery) return orders
    const matchingClientIds = new Set(
      (clients ?? []).filter((c) => c.name.toLowerCase().includes(trimmedQuery)).map((c) => c.id)
    )
    return orders.filter((order) => matchingClientIds.has(order.clientId))
  }, [orders, clients, clientNameQuery])

  async function handlePrintClick(order: Order) {
    // One-off imperative call outside of a hook — `.call()` invokes the
    // same procedure directly, bypassing the React Query cache, while
    // staying on the same typed `orpc` surface as every query/mutation.
    const { base64 } = await orpc.orders.getInvoicePdf.call({ orderId: order.id })
    await window.api.openPdf({
      base64,
      filename: `invoice-${order.invoiceNumber}.pdf`
    })
  }

  if (isError) {
    return <p className="text-destructive">تعذر تحميل الطلبات. يرجى المحاولة مرة أخرى.</p>
  }

  return (
    <OrdersPresenter
      orders={filteredOrders}
      isLoading={isLoading}
      onPrintClick={handlePrintClick}
      clientNameById={clientNameById}
      showClientSearch={!clientId}
      clientNameQuery={clientNameQuery}
      onClientNameQueryChange={setClientNameQuery}
      statusFilter={statusFilter}
      onStatusFilterChange={setStatusFilter}
      dateFrom={dateFrom}
      onDateFromChange={setDateFrom}
      dateTo={dateTo}
      onDateToChange={setDateTo}
    />
  )
}
