import { Trash2 } from 'lucide-react'

import type { OrderLineItem } from '../types'

import { Button } from '#components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '#components/ui/table'
import { formatDZD } from '#lib/utils'

interface OrderItemsTableProps {
  items: OrderLineItem[]
  subtotal: number
  onRemove: (key: string) => void
}

export function OrderItemsTable({ items, subtotal, onRemove }: OrderItemsTableProps) {
  if (items.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">لم تتم إضافة أي عنصر بعد.</p>
    )
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>المنتج</TableHead>
            <TableHead>الكمية</TableHead>
            <TableHead>سعر الوحدة</TableHead>
            <TableHead>الإجمالي</TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>

        <TableBody>
          {items.map((item) => (
            <TableRow key={item.key}>
              <TableCell>{item.product.name}</TableCell>

              <TableCell>{item.quantity}</TableCell>

              <TableCell>{formatDZD(item.unitPrice)}</TableCell>

              <TableCell>{formatDZD(item.unitPrice * item.quantity)}</TableCell>

              <TableCell>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => onRemove(item.key)}
                  aria-label="حذف العنصر"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="mt-3 text-end text-lg font-semibold">الإجمالي: {formatDZD(subtotal)}</div>
    </>
  )
}
