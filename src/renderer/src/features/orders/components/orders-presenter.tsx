import { Link } from '@tanstack/react-router'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '../../../components/ui/table'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Skeleton } from '../../../components/ui/skeleton'
import { Badge } from '../../../components/ui/badge'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '../../../components/ui/select'
import { Plus, Printer, Search } from 'lucide-react'
import { formatCurrency } from '../../../lib/utils'
import type { Order } from '../../../../../shared/schemas/order.schema'
import { printInvoice } from '../utils'

export type OrderStatusFilter = Order['status'] | 'all'

interface OrdersPresenterProps {
  orders: Order[]
  isLoading: boolean
  isFetchingNextPage: boolean
  hasNextPage: boolean
  loadMoreRef: React.RefObject<HTMLTableRowElement | null>
  onPrintClick: (order: Order) => void

  /** Hidden when this list is already scoped to one client (e.g. their own orders page). */
  showClientSearch: boolean
  clientNameQuery: string
  onClientNameQueryChange: (query: string) => void
  statusFilter: OrderStatusFilter
  onStatusFilterChange: (status: OrderStatusFilter) => void
  dateFrom: string
  onDateFromChange: (date: string) => void
  dateTo: string
  onDateToChange: (date: string) => void
}

const STATUS_LABEL: Record<Order['status'], string> = {
  open: 'مفتوح',
  cancelled: 'ملغى'
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
  statusFilter,
  onStatusFilterChange,
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
          <label className="text-xs text-muted-foreground">الحالة</label>
          <Select
            value={statusFilter}
            onValueChange={(v) => onStatusFilterChange(v as OrderStatusFilter)}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الكل</SelectItem>
              <SelectItem value="open">مفتوح</SelectItem>
              <SelectItem value="cancelled">ملغى</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">من تاريخ</label>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => onDateFromChange(e.target.value)}
            className="w-40"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">إلى تاريخ</label>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => onDateToChange(e.target.value)}
            className="w-40"
          />
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
              <TableHead>الحالة</TableHead>
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
                      #{order.invoiceNumber.toString().slice(0, 10)}
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
                    <TableCell>{formatCurrency(order.subtotal)}</TableCell>
                    <TableCell>
                      <Badge variant={order.status === 'cancelled' ? 'destructive' : 'secondary'}>
                        {STATUS_LABEL[order.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => printInvoice(order.id, order.invoiceNumber)}
                      >
                        <Printer className="h-4 w-4" />
                      </Button>
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
