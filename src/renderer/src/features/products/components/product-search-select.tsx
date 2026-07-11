import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Input } from '../../../components/ui/input'
import { Button } from '../../../components/ui/button'
import type { Product } from '../../../../../shared/schemas/product.schema'
import { orpc } from '@renderer/integrations/orpc'

interface ProductSearchSelectProps {
  selectedProduct: Product | undefined
  onSelect: (product: Product) => void
  onClear: () => void
}

/**
 * Type-to-search product picker, backed directly by the existing
 * `products.list` search endpoint. Mirrors `ClientSearchSelect` — see
 * that file for the two-state (searching / selected) rationale.
 */
export function ProductSearchSelect({
  selectedProduct,
  onSelect,
  onClear
}: ProductSearchSelectProps) {
  const [query, setQuery] = React.useState('')
  const [isOpen, setIsOpen] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)

  const { data: products, isLoading } = useQuery(
    orpc.products.list.queryOptions({ input: { query }, enabled: isOpen })
  )

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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
    <div className="relative" ref={containerRef}>
      <Input
        placeholder="ابحث عن منتج بالاسم..."
        value={query}
        onFocus={() => setIsOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value)
          setIsOpen(true)
        }}
      />
      {isOpen && (
        <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-background shadow-md">
          {isLoading ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">جارٍ البحث...</p>
          ) : products && products.length > 0 ? (
            products.map((product) => (
              <button
                key={product.id}
                type="button"
                className="flex w-full items-center justify-between px-3 py-2 text-right text-sm hover:bg-accent"
                onClick={() => {
                  onSelect(product)
                  setQuery('')
                  setIsOpen(false)
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
      )}
    </div>
  )
}
