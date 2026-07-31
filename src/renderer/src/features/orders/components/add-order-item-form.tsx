import * as React from 'react'
import { Plus } from 'lucide-react'

import { Button } from '#components/ui/button'
import { Input } from '#components/ui/input'
import { Label } from '#components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '#components/ui/select'

import type { OrderLineItem } from '../types'
import { createOrderLineItemKey, resolveUnitPrice } from '../utils'
import { Product } from 'src/shared/schemas/product.schema'
import { ProductSearchSelect } from '@renderer/features/products/components/product-search-select'
import { formatDZD } from '#lib/utils'

interface AddOrderItemFormProps {
  items: OrderLineItem[]
  onAdd: (item: OrderLineItem) => void
}

export function AddOrderItemForm({ items, onAdd }: AddOrderItemFormProps) {
  const [product, setProduct] = React.useState<Product>()

  const [quantity, setQuantity] = React.useState<number | ''>('')
  const [priceId, setPriceId] = React.useState<number>()
  const [useCustomPrice, setUseCustomPrice] = React.useState(false)
  const [customPrice, setCustomPrice] = React.useState(0)

  const reset = React.useCallback(() => {
    setProduct(undefined)
    setQuantity('')
    setPriceId(undefined)
    setUseCustomPrice(false)
    setCustomPrice(0)
  }, [])

  const handleProductSelect = React.useCallback((nextProduct: Product) => {
    setProduct(nextProduct)
    setPriceId(nextProduct.prices[0]?.id)
    setUseCustomPrice(false)
  }, [])

  const canAdd =
    product !== undefined &&
    Number.isFinite(quantity) &&
    +quantity > 0 &&
    (useCustomPrice ? Number.isFinite(customPrice) && customPrice >= 0 : priceId !== undefined)

  const handleAdd = () => {
    if (!product || !canAdd) {
      return
    }

    const unitPrice = resolveUnitPrice(
      product,
      useCustomPrice ? undefined : priceId,
      useCustomPrice ? customPrice : undefined
    )

    if (unitPrice === undefined) {
      return
    }

    onAdd({
      key: createOrderLineItemKey(),
      product,
      quantity: +quantity,
      priceId: useCustomPrice ? undefined : priceId,
      customUnitPrice: useCustomPrice ? customPrice : undefined,
      unitPrice
    })

    reset()
  }

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault()
        handleAdd()
      }}
    >
      <ProductSearchSelect
        items={items}
        selectedProduct={product}
        onSelect={handleProductSelect}
        onClear={reset}
      />

      {product && (
        <div className="grid grid-cols-12 items-end gap-2">
          <div className="col-span-2 space-y-1.5">
            <Label htmlFor="order-item-quantity">الكمية</Label>

            <Input
              autoFocus
              id="order-item-quantity"
              type="number"
              step={1}
              value={quantity}
              onChange={(event) => {
                const value = event.target.value === '' ? '' : Number(event.target.value)

                setQuantity(Number.isFinite(value) ? Math.max(1, +value) : '')
              }}
            />
          </div>

          {!useCustomPrice ? (
            <div className="col-span-5 space-y-1.5">
              <Label>السعر</Label>

              <Select
                value={priceId !== undefined ? String(priceId) : undefined}
                onValueChange={(value) => setPriceId(Number(value))}
                disabled={product.prices.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر السعر" />
                </SelectTrigger>

                <SelectContent>
                  {product.prices.map((price) => (
                    <SelectItem key={price.id} value={String(price.id)}>
                      {formatDZD(price.amount)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="col-span-5 space-y-1.5">
              <Label htmlFor="order-item-custom-price">سعر مخصص</Label>

              <Input
                id="order-item-custom-price"
                type="number"
                min={0}
                step="0.01"
                value={customPrice}
                onChange={(event) => {
                  const value = Number(event.target.value)

                  setCustomPrice(Number.isFinite(value) ? Math.max(0, value) : 0)
                }}
              />
            </div>
          )}

          <div className="col-span-3">
            <button
              type="button"
              className="text-xs text-muted-foreground underline"
              onClick={() => setUseCustomPrice((value) => !value)}
            >
              {useCustomPrice ? 'استخدام قائمة الأسعار' : 'سعر مخصص'}
            </button>
          </div>

          <div className="col-span-2">
            <Button type="submit" className="w-full" disabled={!canAdd}>
              <Plus className="h-4 w-4" />
              إضافة
            </Button>
          </div>
        </div>
      )}
    </form>
  )
}
