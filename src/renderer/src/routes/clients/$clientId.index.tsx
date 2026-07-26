import { createRoute, useParams, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { ShoppingCart, Wallet, Plus } from 'lucide-react'
import { Route as RootRoute } from '../__root'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card'
import { Skeleton } from '../../components/ui/skeleton'
import { Button } from '../../components/ui/button'
import { formatDZD } from '../../lib/utils'
import { orpc } from '@renderer/integrations/orpc'

function ClientDetailPage() {
  const { clientId } = useParams({ from: '/clients/$clientId/' })
  const id = Number(clientId)

  const clientQuery = useQuery(orpc.clients.getById.queryOptions({ input: { id } }))
  const balanceQuery = useQuery(orpc.clients.getBalance.queryOptions({ input: { id } }))

  if (clientQuery.isLoading) return <Skeleton className="h-40 w-full" />
  if (clientQuery.isError || !clientQuery.data) {
    return <p className="text-destructive">العميل غير موجود.</p>
  }

  const client = clientQuery.data
  const balance = balanceQuery.data

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{client.name}</h1>
          <p className="text-muted-foreground">{client.phone ?? 'لا يوجد هاتف'}</p>
        </div>
        <Button asChild>
          <Link to="/orders/new" search={{ clientId: id }}>
            <Plus className="h-4 w-4" />
            طلب جديد
          </Link>
        </Button>
      </div>

      <Card className="max-w-xs">
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">الدين المستحق</CardTitle>
        </CardHeader>
        <CardContent className="text-xl font-semibold">
          {balance ? (
            <span className={balance.debt > 0 ? 'text-destructive' : ''}>
              {formatDZD(balance.debt)}
            </span>
          ) : (
            <Skeleton className="h-6 w-24" />
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Link to="/clients/$clientId/orders" params={{ clientId: String(id) }}>
          <Card className="transition-colors hover:bg-accent">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div className="flex items-center gap-3">
                <ShoppingCart className="h-5 w-5 text-muted-foreground" />
                <div>
                  <CardTitle className="text-base">الطلبات السابقة</CardTitle>
                  <CardDescription>عرض جميع طلبات هذا العميل</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </Link>

        <Link to="/clients/$clientId/payments" params={{ clientId: String(id) }}>
          <Card className="transition-colors hover:bg-accent">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div className="flex items-center gap-3">
                <Wallet className="h-5 w-5 text-muted-foreground" />
                <div>
                  <CardTitle className="text-base">سجل المدفوعات</CardTitle>
                  <CardDescription>عرض جميع مدفوعات هذا العميل</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  )
}

export const Route = createRoute({
  getParentRoute: () => RootRoute,
  path: '/clients/$clientId',
  component: ClientDetailPage
})
