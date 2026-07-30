import { RefObject } from 'react'
import { LedgerEntry } from '../types'
import { Table, TableBody, TableHead, TableHeader, TableRow } from '#components/ui/table'

interface LedgersPresenterProps {
  data: LedgerEntry[]
  loadMoreRef: RefObject<HTMLDivElement | null>
  hasNextPage: boolean
}

export default function LedgersPresenter({ data, loadMoreRef }: LedgersPresenterProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>النوع</TableHead>

          <TableHead>الدين قبل</TableHead>
          <TableHead>الكمية</TableHead>
          <TableHead>الدين بعد</TableHead>
          <TableHead className="text-end">الإجراءات</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody></TableBody>
    </Table>
  )
}
