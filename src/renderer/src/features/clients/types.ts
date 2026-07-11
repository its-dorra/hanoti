import type { Client, CreateClientInput } from '../../../shared/schemas/client.schema'

export type { Client, CreateClientInput }

export interface ClientFormValues {
  name: string
  phone: string
  address: string
  notes: string
}
