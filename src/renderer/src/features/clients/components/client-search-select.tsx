import * as React from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { Input } from '#components/ui/input'
import { Button } from '#components/ui/button'
import type { Client } from '../../../../../shared/schemas/client.schema'
import { orpc } from '@renderer/integrations/orpc'
import { useIntersectionObserver } from '#hooks/use-intersection-observer'

interface ClientSearchSelectProps {
  selectedClient: Client | undefined
  onSelect: (client: Client) => void
  onClear: () => void
}

export function ClientSearchSelect({ selectedClient, onSelect, onClear }: ClientSearchSelectProps) {
  const [query, setQuery] = React.useState('')

  const {
    data: pages,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage
  } = useInfiniteQuery(
    orpc.clients.list.infiniteOptions({
      getNextPageParam: (data) => data.nextCursor,
      initialPageParam: null as never,
      input(pageParam) {
        return {
          cursor: pageParam,
          query,
          limit: 20
        }
      }
    })
  )

  const loadMoreRef = useIntersectionObserver<HTMLDivElement>({
    enabled: hasNextPage && !isFetchingNextPage,
    onIntersect: fetchNextPage
  })

  const clients = pages?.pages.flatMap((items) => items.items) ?? []

  if (selectedClient) {
    return (
      <div className="flex items-center justify-between rounded-md border px-3 py-2">
        <div>
          <p className="text-sm font-medium">{selectedClient.name}</p>
          {selectedClient.phone && (
            <p className="text-xs text-muted-foreground">{selectedClient.phone}</p>
          )}
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={() => onClear()}>
          تغيير
        </Button>
      </div>
    )
  }

  return (
    <div className="relative">
      <Input
        placeholder="ابحث عن عميل بالاسم..."
        value={query}

        onChange={(e) => {
          setQuery(e.target.value)
        }}
      />

      <div className="mt-1 max-h-60 w-full overflow-auto rounded-md border bg-background shadow-md">
        {isLoading ? (
          <p className="px-3 py-2 text-sm text-muted-foreground">جارٍ البحث...</p>
        ) : clients.length > 0 ? (
          <>
            {clients.map((client) => (
              <button
                key={client.id}
                type="button"
                className="block w-full px-3 py-2 text-right text-sm hover:bg-accent"
                onClick={() => {
                  onSelect(client)
                  setQuery('')
                }}
              >
                {client.name}
              </button>
            ))}
            {hasNextPage && <div ref={loadMoreRef} />}
          </>
        ) : (
          <p className="px-3 py-2 text-sm text-muted-foreground">لا توجد نتائج</p>
        )}
      </div>
    </div>
  )
}
