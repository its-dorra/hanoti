import { orpc } from '@renderer/integrations/orpc'

import type { Product } from 'src/shared/schemas/product.schema'
import type { OrderDraft, OrderDraftItem, OrderLineItem } from './types'

export async function printInvoice(orderId: number) {
  const { base64 } = await orpc.orders.getInvoicePdf.call({ orderId })
  await window.api.openPdf({
    base64,
    filename: `invoice-${orderId}.pdf`
  })
}

export const ORDER_DRAFT_STORAGE_KEY = 'grocery-app:order-draft'

export function createOrderLineItemKey() {
  return crypto.randomUUID()
}

export function resolveUnitPrice(
  product: Product,
  priceId?: number,
  customUnitPrice?: number
): number | undefined {
  if (customUnitPrice !== undefined) {
    return customUnitPrice
  }

  return product.prices.find((price) => price.id === priceId)?.amount
}

export function resolveDraftItems(draft: OrderDraft, products: Product[]): OrderLineItem[] {
  const productsById = new Map(products.map((product) => [product.id, product]))

  return draft.items.flatMap((draftItem) => {
    const product = productsById.get(draftItem.productId)

    if (!product || draftItem.quantity <= 0) {
      return []
    }

    const unitPrice = resolveUnitPrice(product, draftItem.priceId, draftItem.customUnitPrice)

    if (unitPrice === undefined || unitPrice < 0) {
      return []
    }

    return [
      {
        key: createOrderLineItemKey(),
        product,
        quantity: draftItem.quantity,
        priceId: draftItem.priceId,
        customUnitPrice: draftItem.customUnitPrice,
        unitPrice
      }
    ]
  })
}

export function serializeDraft(
  clientId: number | undefined,
  items: OrderLineItem[],
  depositAmount: number
): OrderDraft {
  return {
    clientId,
    items: items.map(({ product, quantity, priceId, customUnitPrice }): OrderDraftItem => ({
      productId: product.id,
      quantity,
      ...(priceId !== undefined && { priceId }),
      ...(customUnitPrice !== undefined && { customUnitPrice })
    })),
    depositAmount
  }
}

export function mapOrderItemsForSubmission(items: OrderLineItem[]) {
  return items.map(({ product, quantity, priceId, customUnitPrice }) => ({
    productId: product.id,
    quantity,
    ...(customUnitPrice !== undefined ? { customUnitPrice } : { priceId })
  }))
}

export function loadDraft(): OrderDraft | null {
  try {
    const raw = localStorage.getItem(ORDER_DRAFT_STORAGE_KEY)

    if (!raw) {
      return null
    }

    const parsed: unknown = JSON.parse(raw)

    if (!isOrderDraft(parsed)) {
      return null
    }

    return parsed
  } catch {
    return null
  }
}

export function saveDraft(draft: OrderDraft) {
  try {
    localStorage.setItem(ORDER_DRAFT_STORAGE_KEY, JSON.stringify(draft))
  } catch {
    // Draft persistence is optional.
  }
}

export function clearDraft() {
  try {
    localStorage.removeItem(ORDER_DRAFT_STORAGE_KEY)
  } catch {
    // Ignore storage errors.
  }
}

function isOrderDraft(value: unknown): value is OrderDraft {
  if (!value || typeof value !== 'object') {
    return false
  }

  const draft = value as Partial<OrderDraft>

  return Array.isArray(draft.items) && typeof draft.depositAmount === 'number'
}
