import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { ProductsPresenter } from './products-presenter'
import { ProductFormDialog } from './product-form-dialog'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction
} from '../../../components/ui/alert-dialog'
import { useDeleteProduct } from '../hooks/use-delete-product'
import type { Product } from '../../../../../shared/schemas/product.schema'
import { orpc } from '@renderer/integrations/orpc'

export function ProductsContainer() {
  const [searchQuery, setSearchQuery] = React.useState('')
  const [formOpen, setFormOpen] = React.useState(false)
  const [editingProduct, setEditingProduct] = React.useState<Product | undefined>()
  const [deletingProduct, setDeletingProduct] = React.useState<Product | undefined>()

  const deleteProduct = useDeleteProduct()

  const {
    data: products,
    isLoading,
    isError
  } = useQuery(orpc.products.list.queryOptions({ input: { query: searchQuery } }))

  function handleCreateClick() {
    setEditingProduct(undefined)
    setFormOpen(true)
  }

  function handleEditClick(product: Product) {
    setEditingProduct(product)
    setFormOpen(true)
  }

  async function handleConfirmDelete() {
    if (!deletingProduct) return
    await deleteProduct.mutateAsync({ id: deletingProduct.id })
    setDeletingProduct(undefined)
  }

  if (isError) {
    return <p className="text-destructive">تعذر تحميل المنتجات. يرجى المحاولة مرة أخرى.</p>
  }

  return (
    <>
      <ProductsPresenter
        products={products ?? []}
        isLoading={isLoading}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onCreateClick={handleCreateClick}
        onEditClick={handleEditClick}
        onDeleteClick={setDeletingProduct}
      />

      <ProductFormDialog open={formOpen} onOpenChange={setFormOpen} product={editingProduct} />

      <AlertDialog
        open={Boolean(deletingProduct)}
        onOpenChange={(open) => !open && setDeletingProduct(undefined)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف {deletingProduct?.name}؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف هذا المنتج نهائيًا ولا يمكن التراجع عن ذلك. إذا كان المنتج مستخدمًا في طلبات
              سابقة، فلن تتم عملية الحذف حفاظًا على تلك الفواتير.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
