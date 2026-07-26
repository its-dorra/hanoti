import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '../../../components/ui/table'
import { Skeleton } from '../../../components/ui/skeleton'
import { Button } from '../../../components/ui/button'
import { Plus } from 'lucide-react'
import { formatDZD } from '../../../lib/utils'
import { RecordPaymentDialog } from './record-payment-dialog'
import { orpc } from '@renderer/integrations/orpc'

interface ClientPaymentsPageProps {
  clientId: number
}

export function ClientPaymentsPage({ clientId }: ClientPaymentsPageProps) {
  const [dialogOpen, setDialogOpen] = React.useState(false)

  const { data: payments, isLoading } = useQuery(
    orpc.payments.listForClient.queryOptions({ input: { clientId } })
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">سجل المدفوعات</h1>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          تسجيل دفعة
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>التاريخ</TableHead>
              <TableHead>المبلغ</TableHead>
              <TableHead>ملاحظة</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ) : payments && payments.length > 0 ? (
              payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>{new Date(payment.paymentDate).toLocaleDateString('ar')}</TableCell>
                  <TableCell>{formatDZD(payment.amount)}</TableCell>
                  <TableCell>{payment.note ?? '—'}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="py-6 text-center text-muted-foreground">
                  لا توجد مدفوعات بعد.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <RecordPaymentDialog open={dialogOpen} onOpenChange={setDialogOpen} clientId={clientId} />
    </div>
  )
}
