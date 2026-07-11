import { Link } from '@tanstack/react-router'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '../../../components/ui/table'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Skeleton } from '../../../components/ui/skeleton'
import { Pencil, Trash2, Plus, Search } from 'lucide-react'
import type { Client } from '../../../../../shared/schemas/client.schema'

interface ClientsPresenterProps {
  clients: Client[]
  isLoading: boolean
  searchQuery: string
  onSearchChange: (query: string) => void
  onCreateClick: () => void
  onEditClick: (client: Client) => void
  onDeleteClick: (client: Client) => void
}

export function ClientsPresenter({
  clients,
  isLoading,
  searchQuery,
  onSearchChange,
  onCreateClick,
  onEditClick,
  onDeleteClick
}: ClientsPresenterProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">العملاء</h1>
          <p className="text-muted-foreground">إدارة عملائك وحساباتهم.</p>
        </div>
        <Button onClick={onCreateClick}>
          <Plus className="h-4 w-4" />
          عميل جديد
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute start-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="بحث عن العملاء..."
          className="ps-8"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>الاسم</TableHead>
              <TableHead>الهاتف</TableHead>
              <TableHead>العنوان</TableHead>
              <TableHead className="w-24 text-end">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={4}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : clients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                  لا يوجد عملاء.
                </TableCell>
              </TableRow>
            ) : (
              clients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">
                    <Link
                      to="/clients/$clientId"
                      params={{ clientId: String(client.id) }}
                      className="hover:underline"
                    >
                      {client.name}
                    </Link>
                  </TableCell>
                  <TableCell>{client.phone ?? '—'}</TableCell>
                  <TableCell>{client.address ?? '—'}</TableCell>
                  <TableCell className="text-end">
                    <Button variant="ghost" size="icon" onClick={() => onEditClick(client)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onDeleteClick(client)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
