import { Product } from '../../../../../src/shared/schemas/product.schema'

export interface OrderLineItem {
  key: string
  product: Product
  productNameSnapshot: string
  quantity: number
  priceId?: number
  customUnitPrice?: number
  unitPrice: number
}

export interface OrderDraft {
  clientId?: number
  items: Array<{
    productId: number
    productNameSnapshot?: string
    quantity: number
    priceId?: number
    customUnitPrice?: number
  }>
  depositAmount: number
}

export type OrderDraftItem = OrderDraft['items'][number]
