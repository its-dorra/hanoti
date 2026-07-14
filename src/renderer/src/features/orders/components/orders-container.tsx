import * as React from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { OrdersPresenter, type OrderStatusFilter } from './orders-presenter'
import type { Order } from '../../../../../shared/schemas/order.schema'
import { orpc } from '@renderer/integrations/orpc'
import { useIntersectionObserver } from '../../../hooks/use-intersection-observer'

interface OrdersContainerProps {
  /** When set (e.g. embedded on a client's own orders page), filters to that client and hides the name search. */
  clientId?: number
}

export function OrdersContainer({ clientId }: OrdersContainerProps) {
  const [clientNameQuery, setClientNameQuery] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState<OrderStatusFilter>('all')
  const [dateFrom, setDateFrom] = React.useState('')
  const [dateTo, setDateTo] = React.useState('')

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } =
    useInfiniteQuery(
      orpc.orders.list.infiniteOptions({
        input: (pageParam) => ({
          clientId,
          status: statusFilter === 'all' ? undefined : statusFilter,
          dateFrom: dateFrom ? new Date(dateFrom) : undefined,
          dateTo: dateTo ? new Date(dateTo) : undefined,
          cursor: pageParam,
          limit: 20
        }),
        initialPageParam: null as any,
        getNextPageParam: (lastPage) => lastPage.nextCursor
      })
    )

  const orders = React.useMemo(() => {
    return data?.pages.flatMap((page) => page.items) ?? []
  }, [data])

  const loadMoreRef = useIntersectionObserver({
    onIntersect: fetchNextPage,
    enabled: hasNextPage && !isFetchingNextPage
  })

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
      orders={orders}
      isLoading={isLoading}
      isFetchingNextPage={isFetchingNextPage}
      hasNextPage={hasNextPage}
      loadMoreRef={loadMoreRef}
      onPrintClick={handlePrintClick}

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
