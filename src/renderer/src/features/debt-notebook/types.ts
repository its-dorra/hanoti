import { orpcClient } from '@renderer/integrations/orpc'
import type { InferClientOutputs } from '@orpc/client'

export type DebtEntry = InferClientOutputs<typeof orpcClient>['debtNotebook']['findByDebtEntryId']
export type Transaction = InferClientOutputs<
  typeof orpcClient
>['debtNotebook']['listTransactions']['items'][number]
