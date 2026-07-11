import { ProductsContainer } from '../../features/products/components/products-container'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/products/')({
  component: ProductsContainer
})
