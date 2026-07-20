import * as React from 'react'

import type { OrderLineItem } from '../types'
import { loadDraft, saveDraft, serializeDraft } from '../utils'

interface UseOrderDraftPersistenceOptions {
  clientId?: number
  items: OrderLineItem[]
  depositAmount: number
}

export function useOrderDraftPersistence({
  clientId,
  items,
  depositAmount
}: UseOrderDraftPersistenceOptions) {
  const draft = React.useMemo(
    () => serializeDraft(clientId, items, depositAmount),
    [clientId, items, depositAmount]
  )

  React.useEffect(() => {
    saveDraft(draft)

    const interval = window.setInterval(() => {
      saveDraft(draft)
    }, 1000)

    return () => {
      window.clearInterval(interval)
    }
  }, [draft])
}

export function useInitialOrderDraft() {
  return React.useState(loadDraft)[0]
}
