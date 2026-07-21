import * as React from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useInfiniteQuery } from '@tanstack/react-query'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Skeleton } from '../../components/ui/skeleton'

import { formatCurrency } from '../../lib/utils'
import { orpc } from '@renderer/integrations/orpc'
import z from 'zod'
import { useIntersectionObserver } from '#hooks/use-intersection-observer'
import { useDebouncedValue } from '#hooks/use-debounced-value'
import NewEntryFormDialog from '@renderer/features/debt-notebook/components/new-entry-form-dialog'
import { Button } from '#components/ui/button'

function DebtNotebookPage() {
  const [newEntryOpen, setNewEntryOpen] = React.useState(false)

  const { type, query } = Route.useSearch()

  const navigate = Route.useNavigate()
  const debouncedQuery = useDebouncedValue(query, 300)

  const { data, isLoading, isFetchingNextPage, fetchNextPage, hasNextPage } = useInfiniteQuery(
    orpc.debtNotebook.list.infiniteOptions({
      input: (pageParam) =>
        ({
          cursor: pageParam,
          limit: 20,
          type,
          query: debouncedQuery
        }) as never,
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      initialPageParam: null as { createdAt: Date; id: number } | null
    })
  )

  function onQueryChange(e: React.ChangeEvent<HTMLInputElement>) {
    navigate({ to: '.', search: (s) => ({ ...s, query: e.target.value }) })
  }

  const loadMoreRef = useIntersectionObserver<HTMLDivElement>({
    onIntersect: fetchNextPage,
    enabled: hasNextPage && !isFetchingNextPage
  })

  const entries = data?.pages.flatMap((page) => page.items) ?? []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">دفتر الديون</h1>
        </div>

        <NewEntryFormDialog open={newEntryOpen} setOpen={setNewEntryOpen} type={type} />
      </div>

      <div className="flex items-center gap-3">
        <Link
          to="."
          className="rounded-md border p-1 text-sm font-medium transition-colors hover:bg-primary/10 hover:text-primary"
          search={(s) => ({ ...s, query: '', type: 'buyer' })}
          activeProps={{ className: 'bg-primary text-primary-foreground' }}
        >
          <Button variant="ghost">دين</Button>
        </Link>
        <Link
          to="."
          className="rounded-md border p-1 text-sm font-medium transition-colors hover:bg-primary/10 hover:text-primary"

          search={(s) => ({ ...s, query: '', type: 'seller' })}
          activeProps={{ className: 'bg-primary text-primary-foreground ' }}
        >
          <Button variant="ghost">بيع</Button>
        </Link>
      </div>

      <Input placeholder="بحث عن عملاء..." value={query} onChange={onQueryChange} />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)
        ) : entries.length ? (
          <>
            {entries.map((entry) => (
              <Card key={entry.id}>
                <CardHeader>
                  <Link
                    to="/debt-notebook/$debtEntryId"
                    params={{ debtEntryId: String(entry.id) }}
                    search={{ type }}
                  >
                    <CardTitle>{entry.clientName}</CardTitle>
                  </Link>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p
                    className={`text-lg font-semibold ${entry.debt > 0 ? 'text-destructive' : ''}`}
                  >
                    {formatCurrency(entry.debt)}
                  </p>
                </CardContent>
              </Card>
            ))}
            {hasNextPage && <div ref={loadMoreRef} />}
          </>
        ) : (
          <p className="text-muted-foreground">لا توجد قيود ديون بعد.</p>
        )}
      </div>
    </div>
  )
}

export const Route = createFileRoute('/debt-notebook/')({
  validateSearch: z.object({
    type: z.enum(['buyer', 'seller']).default('buyer'),
    query: z.string().default('')
  }),
  component: DebtNotebookPage
})
