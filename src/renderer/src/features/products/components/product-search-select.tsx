import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Input } from '../../../components/ui/input'
import { Button } from '../../../components/ui/button'
import type { Product } from '../../../../../shared/schemas/product.schema'
import { orpc } from '@renderer/integrations/orpc'
import { OrderLineItem } from '@renderer/features/orders/types'

interface ProductSearchSelectProps {
  selectedProduct: Product | undefined
  onSelect: (product: Product) => void
  onClear: () => void
  items: OrderLineItem[]
}

export function ProductSearchSelect({
  selectedProduct,
  onSelect,
  onClear,
  items
}: ProductSearchSelectProps) {
  const [query, setQuery] = React.useState('')

  const { data: products, isLoading } = useQuery(
    orpc.products.list.queryOptions({ input: { query } })
  )

  const filteredProducts = React.useMemo(() => {
    if (!products) {
      return []
    }

    const selectedProductIds = new Set(items.map((item) => item.product.id))

    return products.filter((product) => !selectedProductIds.has(product.id))
  }, [products, items])

  if (selectedProduct) {
    return (
      <div className="flex items-center justify-between rounded-md border px-3 py-2">
        <div>
          <p className="text-sm font-medium">{selectedProduct.name}</p>
          <p className="text-xs text-muted-foreground">{selectedProduct.quantity} بالمخزون</p>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={onClear}>
          تغيير
        </Button>
      </div>
    )
  }

  return (
    <div>
      <Input
        placeholder="ابحث عن منتج بالاسم..."
        value={query}

        onChange={(e) => {
          setQuery(e.target.value)
        }}
      />

      <div className="mt-1 max-h-60 w-full overflow-auto rounded-md border bg-background shadow-md">
        {isLoading ? (
          <p className="px-3 py-2 text-sm text-muted-foreground">جارٍ البحث...</p>
        ) : filteredProducts && filteredProducts.length > 0 ? (
          filteredProducts.map((product) => (
            <button
              key={product.id}
              type="button"
              className="flex w-full items-center justify-between px-3 py-2 text-right text-sm hover:bg-accent"
              onClick={() => {
                onSelect(product)
                setQuery('')
              }}
            >
              <span>{product.name}</span>
              <span className="text-xs text-muted-foreground">{product.quantity} بالمخزون</span>
            </button>
          ))
        ) : (
          <p className="px-3 py-2 text-sm text-muted-foreground">لا توجد نتائج</p>
        )}
      </div>
    </div>
  )
}
