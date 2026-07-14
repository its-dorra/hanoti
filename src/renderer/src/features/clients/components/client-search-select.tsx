import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Input } from '../../../components/ui/input'
import { Button } from '../../../components/ui/button'
import type { Client } from '../../../../../shared/schemas/client.schema'
import { orpc } from '@renderer/integrations/orpc'

interface ClientSearchSelectProps {
  selectedClient: Client | undefined
  onSelect: (client: Client) => void
  onClear: () => void
}

/**
 * Type-to-search client picker, backed directly by the existing
 * `clients.list` search endpoint (the same one the Clients page's search
 * box uses) rather than a plain dropdown of every client — searches as
 * the cashier types instead of requiring them to scroll a long list.
 *
 * Two states: unselected (a live search box + results dropdown) and
 * selected (a small summary with a "تغيير" button to search again).
 */
export function ClientSearchSelect({ selectedClient, onSelect, onClear }: ClientSearchSelectProps) {
  const [query, setQuery] = React.useState('')
  const [isOpen, setIsOpen] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)

  const { data: clients, isLoading } = useQuery(
    orpc.clients.list.queryOptions({ input: { query }, enabled: isOpen })
  )

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (selectedClient) {
    return (
      <div className="flex items-center justify-between rounded-md border px-3 py-2">
        <div>
          <p className="text-sm font-medium">{selectedClient.name}</p>
          {selectedClient.phone && (
            <p className="text-xs text-muted-foreground">{selectedClient.phone}</p>
          )}
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={onClear}>
          تغيير
        </Button>
      </div>
    )
  }

  return (
    <div className="relative" ref={containerRef}>
      <Input
        placeholder="ابحث عن عميل بالاسم..."
        value={query}
        onFocus={() => setIsOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value)
          setIsOpen(true)
        }}
      />
      {isOpen && (
        <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-background shadow-md">
          {isLoading ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">جارٍ البحث...</p>
          ) : clients && clients.items.length > 0 ? (
            clients.items.map((client) => (
              <button
                key={client.id}
                type="button"
                className="block w-full px-3 py-2 text-right text-sm hover:bg-accent"
                onClick={() => {
                  onSelect(client)
                  setQuery('')
                  setIsOpen(false)
                }}
              >
                {client.name}
              </button>
            ))
          ) : (
            <p className="px-3 py-2 text-sm text-muted-foreground">لا توجد نتائج</p>
          )}
        </div>
      )}
    </div>
  )
}
