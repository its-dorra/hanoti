import { useIntersectionObserver } from '#hooks/use-intersection-observer'
import { orpc } from '@renderer/integrations/orpc'
import { useInfiniteQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'

const route = getRouteApi('/clients/$clientId/')

export default function LedgersContainer({ clientId }: { clientId: number }) {
  const search = route.useSearch()
  const { data, hasNextPage, isFetchingNextPage, fetchNextPage } = useInfiniteQuery(
    orpc.ledgers.listAll.infiniteOptions({
      initialPageParam: null as any,
      getNextPageParam: (data) => data.nextCursor,
      input: (pageParam) => ({
        cursor: pageParam,
        clientId,
        limit: 20,
        before: search.before,
        type: search.type
      })
    })
  )

  const loadMoreRef = useIntersectionObserver<HTMLDivElement>({
    enabled: hasNextPage && !isFetchingNextPage,
    onIntersect: fetchNextPage
  })
}
