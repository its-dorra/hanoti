import * as React from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { OrdersPresenter } from './orders-presenter'
import { orpc } from '@renderer/integrations/orpc'
import { useIntersectionObserver } from '@/hooks/use-intersection-observer'

interface OrdersContainerProps {
  /** When set (e.g. embedded on a client's own orders page), filters to that client and hides the name search. */
  clientId?: number
}

export function OrdersContainer({ clientId }: OrdersContainerProps) {
  const [clientNameQuery, setClientNameQuery] = React.useState('')
  const [dateFrom, setDateFrom] = React.useState<Date>()
  const [dateTo, setDateTo] = React.useState<Date>()

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } =
    useInfiniteQuery(
      orpc.orders.list.infiniteOptions({
        input: (pageParam) => ({
          clientId,
          dateFrom: dateFrom ? new Date(dateFrom) : undefined,
          dateTo: dateTo ? new Date(dateTo) : undefined,
          cursor: pageParam,
          limit: 20,
          query: clientNameQuery
        }),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        initialPageParam: null as any,
        getNextPageParam: (lastPage) => lastPage.nextCursor
      })
    )

  const orders = React.useMemo(() => {
    return data?.pages.flatMap((page) => page.items) ?? []
  }, [data])

  const loadMoreRef = useIntersectionObserver<HTMLTableRowElement>({
    onIntersect: fetchNextPage,
    enabled: hasNextPage && !isFetchingNextPage
  })

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

      showClientSearch={!clientId}
      clientNameQuery={clientNameQuery}
      onClientNameQueryChange={setClientNameQuery}

      dateFrom={dateFrom}
      onDateFromChange={setDateFrom}
      dateTo={dateTo}
      onDateToChange={setDateTo}
    />
  )
}
