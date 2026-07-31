import { useParams, Link, createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Plus, ArrowRight } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card'
import { Skeleton } from '../../components/ui/skeleton'
import { Button } from '../../components/ui/button'
import { formatDZD } from '../../lib/utils'
import { orpc } from '@renderer/integrations/orpc'
import z from 'zod'
import LedgersContainer from '@renderer/features/ledgers/components/ledgers-container'
import { RecordPaymentDialog } from '@renderer/features/payments/components/record-payment-dialog'
import { DatePicker } from '#components/date-picker'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '#components/ui/select'

function ClientDetailPage() {
  const { clientId } = useParams({ from: '/clients/$clientId/' })
  const id = Number(clientId)

  const clientQuery = useQuery(orpc.clients.getById.queryOptions({ input: { id } }))

  if (clientQuery.isLoading) return <Skeleton className="h-40 w-full" />
  if (clientQuery.isError || !clientQuery.data) {
    return <p className="text-destructive">العميل غير موجود.</p>
  }

  const client = clientQuery.data

  return (
    <div className="space-y-6">
      <Link
        to="/clients"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowRight className="h-4 w-4" />
        العودة إلى الزبائن
      </Link>

      <div className="flex items-center gap-4 lg:gap-24">
        <div>
          <h1 className="text-2xl font-semibold">{client.name}</h1>
          <p className="text-muted-foreground">{client.phone ?? 'لا يوجد هاتف'}</p>
        </div>
        <Card className="w-fit min-w-64">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">الدين المستحق</CardTitle>
          </CardHeader>
          <CardContent className="text-xl font-semibold">
            <span className={client.balance > 0 ? 'text-destructive' : ''}>
              {formatDZD(client.balance)}
            </span>
          </CardContent>
        </Card>
        <div className="mr-auto inline-flex items-center gap-2 flex-col lg:flex-row">
          <Button asChild>
            <Link to="/orders/new" search={{ clientId: id }}>
              <Plus className="h-4 w-4" />
              طلب جديد
            </Link>
          </Button>
          <RecordPaymentDialog clientId={id} />
        </div>
      </div>
      <Filters />
      <LedgersContainer clientId={id} />
    </div>
  )
}

const ledgerTypes = [
  {
    value: 'all',
    label: 'الكل'
  },
  {
    value: 'order',
    label: 'الفاتورات'
  },
  {
    value: 'payment',
    label: 'المدفوعات'
  }
] as const

type LedgerType = (typeof ledgerTypes)[number]['value']

function Filters() {
  const beforeDate = Route.useSearch({ select: (search) => search.before })
  const type = Route.useSearch({ select: (search) => search.type })
  const navigate = Route.useNavigate()

  function setDate(date: Date | undefined) {
    navigate({ search: (old) => ({ ...old, before: date }) })
  }

  function setType(type: LedgerType) {
    navigate({ search: (old) => ({ ...old, type }) })
  }

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
      <div>
        <DatePicker date={beforeDate || new Date()} setDate={setDate} />
      </div>
      <div className="w-full">
        <Select defaultValue={type} onValueChange={(value) => setType(value as LedgerType)}>
          <SelectTrigger className="w-full max-w-74">
            <SelectValue placeholder="النوع" />
          </SelectTrigger>
          <SelectContent className="w-full max-w-74">
            {ledgerTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/clients/$clientId/')({
  validateSearch: z.object({
    before: z.coerce.date().optional(),
    type: z.enum(['all', 'payment', 'order']).default('all')
  }),
  component: ClientDetailPage
})
