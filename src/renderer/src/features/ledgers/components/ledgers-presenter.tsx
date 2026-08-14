import { RefObject } from 'react'
import { Link } from '@tanstack/react-router'
import { Pencil } from 'lucide-react'
import { LedgerEntry } from '../types'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '#components/ui/table'
import { Button } from '#components/ui/button'
import { formatDZD } from '#lib/utils'
import PrintOrderDialog from './print-order-dialog'

interface LedgersPresenterProps {
  data: LedgerEntry[]
  loadMoreRef: RefObject<HTMLDivElement | null>
  hasNextPage: boolean
}

export default function LedgersPresenter({
  data,
  loadMoreRef,
  hasNextPage
}: LedgersPresenterProps) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>النوع</TableHead>
            <TableHead>الدين قبل</TableHead>
            <TableHead>الكمية</TableHead>
            <TableHead>الدين بعد</TableHead>
            <TableHead>التاريخ و الوقت</TableHead>
            <TableHead className="text-end">الإجراءات</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center">
                لا يوجد سجلات لهذا الزبون بعد
              </TableCell>
            </TableRow>
          ) : (
            <>
              {data.map((ledger) => (
                <TableRow key={`ledger-${ledger.clientId}-${ledger.id}`}>
                  <TableCell>{ledger.referenceType === 'order' ? 'فاتورة' : 'دفع مبلغ'}</TableCell>
                  <TableCell>{formatDZD(ledger.balanceBefore)}</TableCell>
                  <TableCell>{formatDZD(ledger.amount)}</TableCell>
                  <TableCell>{formatDZD(ledger.balanceAfter)}</TableCell>

                  <TableCell>
                    {ledger.createdAt.toLocaleDateString('fr')} -{' '}
                    {ledger.createdAt.toLocaleTimeString('fr')}
                  </TableCell>
                  <TableCell className="text-end">
                    {ledger.referenceType === 'order' && (
                      <div className="flex items-center justify-end gap-1">
                        <Button asChild variant="ghost" size="icon" title="تعديل الطلب">
                          <Link
                            to="/orders/$orderId/edit"
                            params={{ orderId: String(ledger.referenceId) }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                        <PrintOrderDialog
                          orderId={ledger.referenceId}
                          createdAt={ledger.createdAt}
                        />
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {hasNextPage && <div ref={loadMoreRef} />}
            </>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
