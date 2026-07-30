import { Button } from '#components/ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from '#components/ui/dropdown-menu'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '#components/ui/table'
import { useIntersectionObserver } from '#hooks/use-intersection-observer'
import { orpc } from '@renderer/integrations/orpc'
import { useInfiniteQuery } from '@tanstack/react-query'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import UpdateTransactionDialog from './update-transaction-dialog-form'
import DeleteTransactionDialog from './delete-transaction-dialog'
import { useState } from 'react'
import { Transaction } from '../types'
import { formatDZD } from '#lib/utils'

export default function DebtTransactions({ debtEntryId }: { debtEntryId: number }) {
  const { data, fetchNextPage, isFetchingNextPage, hasNextPage } = useInfiniteQuery(
    orpc.debtNotebook.listTransactions.infiniteOptions({
      input: (pageParams) => ({
        debtEntryId,
        limit: 20,
        cursor: pageParams
      }),
      getNextPageParam: (data) => data.nextCursor,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      initialPageParam: null as any
    })
  )

  const [transactionToBeUpdated, setTransactionToBeUpdated] = useState<null | Transaction>(null)
  const [transactionToBeDeleted, setTransactionToBeDeleted] = useState<null | number>(null)

  const transactions = data?.pages.flatMap((items) => items.items) ?? []

  const loadMoreRef = useIntersectionObserver<HTMLDivElement>({
    onIntersect: fetchNextPage,
    enabled: hasNextPage && !isFetchingNextPage
  })

  return (
    <div className="rounded-lg border mt-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>المبلغ</TableHead>
            <TableHead>النوع</TableHead>
            <TableHead>التاريخ</TableHead>
            <TableHead>ملاحظات</TableHead>

            <TableHead className="w-24 text-end">الإجراءات</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => {
            const today = new Date()

            const dayAfter = transaction.date

            dayAfter.setDate(dayAfter.getDate() + 1)

            return (
              <TableRow key={`transaction-row-${transaction.id}`}>
                <TableCell>{formatDZD(transaction.amount)}</TableCell>
                <TableCell>{transaction.type === 'deposit' ? 'إيداع' : 'دين'}</TableCell>
                <TableCell>
                  {transaction.date.toLocaleDateString('fr')} -{' '}
                  {transaction.date.toLocaleTimeString('fr', { hourCycle: 'h24' })}
                </TableCell>
                <TableCell>{transaction.note ?? '—'}</TableCell>
                {today <= dayAfter && (
                  <TableCell className="text-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <span className="sr-only">فتح القائمة</span>
                          <MoreHorizontal />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem asChild>
                          <Button
                            onClick={() => {
                              setTransactionToBeUpdated(transaction)
                            }}
                            variant="ghost"
                          >
                            <Pencil className="size-6 text-blue-600" />
                            تعديل القيد
                          </Button>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Button
                            onClick={() => {
                              setTransactionToBeDeleted(transaction.id)
                            }}
                            variant="ghost"
                          >
                            <Trash2 className="text-red-500 size-6" />
                            <span>حذف</span>
                          </Button>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                )}
              </TableRow>
            )
          })}
          {hasNextPage && <div ref={loadMoreRef} />}
        </TableBody>
        <UpdateTransactionDialog
          transaction={transactionToBeUpdated}
          onClose={() => setTransactionToBeUpdated(null)}
        />
        <DeleteTransactionDialog
          transactionId={transactionToBeDeleted}
          onClose={() => setTransactionToBeDeleted(null)}
        />
      </Table>
    </div>
  )
}
