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
import { Pencil, Trash2, Plus, Search } from 'lucide-react'
import { formatDZD } from '../../../lib/utils'
import type { Product } from '../../../../../shared/schemas/product.schema'

interface ProductsPresenterProps {
  products: Product[]
  isLoading: boolean
  searchQuery: string
  onSearchChange: (query: string) => void
  onCreateClick: () => void
  onEditClick: (product: Product) => void
  onDeleteClick: (product: Product) => void
}

export function ProductsPresenter({
  products,
  isLoading,
  searchQuery,
  onSearchChange,
  onCreateClick,
  onEditClick,
  onDeleteClick
}: ProductsPresenterProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">المنتجات</h1>
          <p className="text-muted-foreground">إدارة المخزون وأسعار البيع.</p>
        </div>
        <Button onClick={onCreateClick}>
          <Plus className="h-4 w-4" />
          منتج جديد
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute start-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="بحث عن المنتجات..."
          className="ps-8"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>الاسم</TableHead>
              <TableHead>سعر الشراء</TableHead>
              <TableHead>أسعار البيع</TableHead>
              <TableHead>المخزون</TableHead>
              <TableHead className="w-24 text-end">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={5}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  لا توجد منتجات.
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{formatDZD(product.buyingPrice)}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {product.prices.map((p) => (
                        <Badge key={p.id} variant="secondary">
                          {formatDZD(p.amount)}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={product.quantity === 0 ? 'text-destructive' : ''}>
                      {product.quantity}
                    </span>
                  </TableCell>
                  <TableCell className="text-end">
                    <Button variant="ghost" size="icon" onClick={() => onEditClick(product)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onDeleteClick(product)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
