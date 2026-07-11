import { ClientsContainer } from '../../features/clients/components/clients-container'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/clients/')({
  component: ClientsContainer
})
