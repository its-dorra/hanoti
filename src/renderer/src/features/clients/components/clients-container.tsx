import * as React from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { ClientsPresenter } from './clients-presenter'
import { ClientFormDialog } from './client-form-dialog'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction
} from '../../../components/ui/alert-dialog'
import { useDeleteClient } from '../hooks/use-delete-client'
import type { Client } from '../../../../../shared/schemas/client.schema'
import { orpc } from '@renderer/integrations/orpc'
import { useIntersectionObserver } from '../../../hooks/use-intersection-observer'

export function ClientsContainer() {
  const [searchQuery, setSearchQuery] = React.useState('')
  const [formOpen, setFormOpen] = React.useState(false)
  const [editingClient, setEditingClient] = React.useState<Client | undefined>()
  const [deletingClient, setDeletingClient] = React.useState<Client | undefined>()

  const deleteClient = useDeleteClient()

  // Queries are called directly in the component per the architecture's
  // data-fetching rule — no custom query hooks, only mutation hooks.
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } =
    useInfiniteQuery(
      orpc.clients.list.infiniteOptions({
        input: (pageParam) => ({
          query: searchQuery,
          cursor: pageParam,
          limit: 20
        }),
        initialPageParam: null as any,
        getNextPageParam: (lastPage) => lastPage.nextCursor
      })
    )

  const clients = React.useMemo(() => {
    return data?.pages.flatMap((page) => page.items) ?? []
  }, [data])

  const loadMoreRef = useIntersectionObserver({
    onIntersect: fetchNextPage,
    enabled: hasNextPage && !isFetchingNextPage
  })

  function handleCreateClick() {
    setEditingClient(undefined)
    setFormOpen(true)
  }

  function handleEditClick(client: Client) {
    setEditingClient(client)
    setFormOpen(true)
  }

  async function handleConfirmDelete() {
    if (!deletingClient) return
    await deleteClient.mutateAsync({ id: deletingClient.id })
    setDeletingClient(undefined)
  }

  if (isError) {
    return <p className="text-destructive">تعذر تحميل العملاء. يرجى المحاولة مرة أخرى.</p>
  }

  return (
    <>
      <ClientsPresenter
        clients={clients}
        isLoading={isLoading}
        isFetchingNextPage={isFetchingNextPage}
        hasNextPage={hasNextPage}
        loadMoreRef={loadMoreRef}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onCreateClick={handleCreateClick}
        onEditClick={handleEditClick}
        onDeleteClick={setDeletingClient}
      />

      <ClientFormDialog open={formOpen} onOpenChange={setFormOpen} client={editingClient} />

      <AlertDialog
        open={Boolean(deletingClient)}
        onOpenChange={(open) => !open && setDeletingClient(undefined)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف {deletingClient?.name}؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف هذا العميل نهائيًا ولا يمكن التراجع عن ذلك. إذا كان لدى العميل طلبات أو
              مدفوعات سابقة، فلن تتم عملية الحذف حفاظًا على سجلاته.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
