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
import { MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react'
import { formatDZD } from '../../../lib/utils'
import { RecordPaymentDialog } from './record-payment-dialog'
import { orpc } from '@renderer/integrations/orpc'
import { Payment } from 'src/shared/schemas/payment.schema'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '#components/ui/dropdown-menu'
import DeletePaymentDialog from './delete-payment-dialog'

interface ClientPaymentsPageProps {
  clientId: number
}

export function ClientPaymentsPage({ clientId }: ClientPaymentsPageProps) {
  const [dialogOpen, setDialogOpen] = React.useState(false)

  const [paymentToEdit, setPaymentToEdit] = React.useState<Payment>()
  const [paymentToDelete, setPaymentToDelete] = React.useState<Payment>()

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
              <TableHead className="text-end">إجراءات</TableHead>
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
              payments.map((payment) => {
                const dateAfter = new Date(payment.paymentDate)
                dateAfter.setDate(dateAfter.getDate() + 1) // Add one day to the date

                return (
                  <TableRow key={payment.id}>
                    <TableCell>
                      {payment.paymentDate.toLocaleDateString('ar')} -{' '}
                      {payment.paymentDate.toLocaleTimeString('fr')}
                    </TableCell>
                    <TableCell>{formatDZD(payment.amount)}</TableCell>
                    <TableCell>{payment.note ?? '—'}</TableCell>
                    {dateAfter >= new Date() && (
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
                                  setPaymentToEdit(payment)
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
                                  setPaymentToDelete(payment)
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
              })
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

      {paymentToEdit && (
        <RecordPaymentDialog
          type="update"
          payment={paymentToEdit}
          onClose={() => setPaymentToEdit(undefined)}
        />
      )}

      {paymentToDelete && (
        <DeletePaymentDialog
          onClose={() => setPaymentToDelete(undefined)}
          payment={paymentToDelete}
        />
      )}

      <RecordPaymentDialog
        type="create"
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        clientId={clientId}
      />
    </div>
  )
}
