import { Link } from '@tanstack/react-router'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '#components/ui/table'
import { Button } from '#components/ui/button'
import { Input } from '#components/ui/input'
import { Skeleton } from '#components/ui/skeleton'

import { Plus, Search } from 'lucide-react'
import { formatDZD } from '@/lib/utils'
import type { Order } from '../../../../../shared/schemas/order.schema'

import { Label } from '#components/ui/label'
import { DatePicker } from '#components/date-picker'
import PrintOrderDialog from '@renderer/features/ledgers/components/print-order-dialog'

interface OrdersPresenterProps {
  orders: Order[]
  isLoading: boolean
  isFetchingNextPage: boolean
  hasNextPage: boolean
  loadMoreRef: React.RefObject<HTMLTableRowElement | null>

  /** Hidden when this list is already scoped to one client (e.g. their own orders page). */
  showClientSearch: boolean
  clientNameQuery: string
  onClientNameQueryChange: (query: string) => void
  dateFrom: Date | undefined
  onDateFromChange: (date: Date | undefined) => void
  dateTo: Date | undefined
  onDateToChange: (date: Date | undefined) => void
}

export function OrdersPresenter({
  orders,
  isLoading,
  isFetchingNextPage,
  hasNextPage,
  loadMoreRef,

  showClientSearch,
  clientNameQuery,
  onClientNameQueryChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange
}: OrdersPresenterProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">الطلبات</h1>
          <p className="text-muted-foreground">إنشاء الفواتير وإعادة طباعة الطلبات السابقة.</p>
        </div>
        <Button asChild>
          <Link to="/orders/new">
            <Plus className="h-4 w-4" />
            طلب جديد
          </Link>
        </Button>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        {showClientSearch && (
          <div className="relative w-64">
            <Search className="absolute inset-s-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث باسم العميل..."
              className="ps-8"
              value={clientNameQuery}
              onChange={(e) => onClientNameQueryChange(e.target.value)}
            />
          </div>
        )}

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">من تاريخ</Label>
          <DatePicker date={dateFrom} setDate={onDateFromChange} />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">إلى تاريخ</Label>
          <DatePicker date={dateTo} setDate={onDateToChange} />
        </div>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>رقم الفاتورة</TableHead>
              <TableHead>العميل</TableHead>
              <TableHead>التاريخ</TableHead>
              <TableHead>الإجمالي</TableHead>
              <TableHead className="w-16 text-end">طباعة</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  لا توجد طلبات مطابقة.
                </TableCell>
              </TableRow>
            ) : (
              <>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">
                      #{order.id.toString().slice(0, 10)}
                    </TableCell>
                    <TableCell>
                      <Link
                        to="/clients/$clientId"
                        params={{ clientId: String(order.clientId) }}
                        className="hover:underline"
                      >
                        {order.clientName}
                      </Link>
                    </TableCell>
                    <TableCell>{new Date(order.orderDate).toLocaleDateString('en-UK')}</TableCell>
                    <TableCell>{formatDZD(order.subtotal)}</TableCell>

                    <TableCell className="text-end">
                      <PrintOrderDialog orderId={order.id} createdAt={order.orderDate} />
                    </TableCell>
                  </TableRow>
                ))}
                {hasNextPage && (
                  <TableRow ref={loadMoreRef}>
                    <TableCell
                      colSpan={6}
                      className="py-4 text-center text-muted-foreground text-sm"
                    >
                      {isFetchingNextPage ? 'جاري تحميل المزيد...' : 'تحميل المزيد'}
                    </TableCell>
                  </TableRow>
                )}
              </>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
