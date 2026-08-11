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
  ref: React.Ref<{ focus: () => void }>
}

export function ProductSearchSelect({
  selectedProduct,
  onSelect,
  onClear,
  items,
  ref
}: ProductSearchSelectProps) {
  const [query, setQuery] = React.useState('')
  const [highlightedIndex, setHighlightedIndex] = React.useState(-1)

  const inputRef = React.useRef<HTMLInputElement>(null)
  const optionRefs = React.useRef<Record<string, HTMLButtonElement | null>>({})

  // React.useImperativeHandle(ref, () => ({
  //   focus: () => {
  //     inputRef.current?.focus()
  //   }
  // }))

  const { data: products, isLoading } = useQuery(
    orpc.products.list.queryOptions({
      input: { query }
    })
  )

  const filteredProducts = React.useMemo(() => {
    if (!products) {
      return []
    }

    const selectedProductIds = new Set(items.map((item) => item.product.id))

    return products.filter((product) => !selectedProductIds.has(product.id))
  }, [products, items])

  React.useEffect(() => {
    if (!selectedProduct) {
      inputRef.current?.focus()
    }
  }, [selectedProduct])

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHighlightedIndex((current) => {
      if (filteredProducts.length === 0) {
        return -1
      }

      return Math.min(current, filteredProducts.length - 1)
    })
  }, [filteredProducts.length])

  React.useEffect(() => {
    if (highlightedIndex < 0) {
      return
    }

    const product = filteredProducts[highlightedIndex]

    if (!product) {
      return
    }

    optionRefs.current[product.id]?.scrollIntoView({
      block: 'nearest'
    })
  }, [highlightedIndex, filteredProducts])

  const selectProduct = React.useCallback(
    (index: number) => {
      const product = filteredProducts[index]

      if (!product) {
        return
      }

      onSelect(product)

      setQuery('')
      setHighlightedIndex(-1)
    },
    [filteredProducts, onSelect]
  )

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (isLoading) {
      return
    }

    switch (event.key) {
      case 'ArrowDown': {
        if (filteredProducts.length === 0) {
          return
        }

        event.preventDefault()

        setHighlightedIndex((current) => (current < filteredProducts.length - 1 ? current + 1 : 0))

        break
      }

      case 'ArrowUp': {
        if (filteredProducts.length === 0) {
          return
        }

        event.preventDefault()

        setHighlightedIndex((current) => (current > 0 ? current - 1 : filteredProducts.length - 1))

        break
      }

      case 'Home': {
        if (filteredProducts.length === 0) {
          return
        }

        event.preventDefault()
        setHighlightedIndex(0)

        break
      }

      case 'End': {
        if (filteredProducts.length === 0) {
          return
        }

        event.preventDefault()
        setHighlightedIndex(filteredProducts.length - 1)

        break
      }

      case 'Enter': {
        if (highlightedIndex < 0) {
          return
        }

        event.preventDefault()
        selectProduct(highlightedIndex)

        break
      }

      case 'Escape': {
        event.preventDefault()

        if (query) {
          setQuery('')
          setHighlightedIndex(-1)
        }

        break
      }

      default:
        break
    }
  }

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

  const activeProduct = filteredProducts[highlightedIndex]

  return (
    <div>
      <Input
        ref={inputRef}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={filteredProducts.length > 0}
        aria-controls="product-search-listbox"
        aria-activedescendant={activeProduct ? `product-option-${activeProduct.id}` : undefined}
        placeholder="ابحث عن منتج بالاسم..."
        value={query}
        onChange={(event) => {
          setQuery(event.target.value)
          setHighlightedIndex(-1)
        }}
        onKeyDown={handleKeyDown}
      />

      <div
        id="product-search-listbox"
        role="listbox"
        className="mt-1 max-h-60 w-full overflow-auto rounded-md border bg-background shadow-md"
      >
        {isLoading ? (
          <p className="px-3 py-2 text-sm text-muted-foreground">جارٍ البحث...</p>
        ) : filteredProducts.length > 0 ? (
          filteredProducts.map((product, index) => {
            const isHighlighted = index === highlightedIndex

            return (
              <button
                key={product.id}
                id={`product-option-${product.id}`}
                ref={(element) => {
                  optionRefs.current[product.id] = element
                }}
                type="button"
                role="option"
                aria-selected={isHighlighted}
                className={[
                  'flex w-full items-center justify-between px-3 py-2 text-right text-sm',
                  'hover:bg-accent',
                  isHighlighted && 'bg-accent'
                ]
                  .filter(Boolean)
                  .join(' ')}
                onMouseEnter={() => {
                  setHighlightedIndex(index)
                }}
                onClick={() => {
                  selectProduct(index)
                }}
              >
                <span>{product.name}</span>

                <span className="text-xs text-muted-foreground">{product.quantity} بالمخزون</span>
              </button>
            )
          })
        ) : (
          <p className="px-3 py-2 text-sm text-muted-foreground">لا توجد نتائج</p>
        )}
      </div>
    </div>
  )
}
