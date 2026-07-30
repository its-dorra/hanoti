import { orpc } from '@renderer/integrations/orpc'

export type LedgerEntry = Awaited<ReturnType<typeof orpc.ledgers.listAll.call>>['items'][number]
