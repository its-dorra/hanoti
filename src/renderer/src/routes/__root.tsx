import { createRootRouteWithContext, Link, Outlet } from '@tanstack/react-router'
import { Users, Package, ShoppingCart, BookOpen, Sun, Moon } from 'lucide-react'
import { useTheme } from '../lib/theme-provider'
import { cn } from '../lib/utils'
import { QueryClient } from 'node_modules/@tanstack/react-query/build/modern/_tsup-dts-rollup'

const NAV_ITEMS = [
  { to: '/clients', label: 'العملاء', icon: Users },
  { to: '/products', label: 'المنتجات', icon: Package },
  { to: '/orders', label: 'الطلبات', icon: ShoppingCart },
  { to: '/debt-notebook', label: 'دفتر الديون', icon: BookOpen }
] as const

function RootLayout() {
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      <aside className="flex w-56 shrink-0 flex-col border-e bg-card">
        <div className="flex h-14 items-center px-4 font-semibold">إدارة البقالة</div>
        <nav className="flex flex-1 flex-col gap-1 p-2">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground'
              )}
              activeProps={{ className: 'bg-primary text-primary-foreground' }}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-2">
          <button
            onClick={toggleTheme}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          >
            {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            {theme === 'light' ? 'الوضع الداكن' : 'الوضع الفاتح'}
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto p-6">
        <Outlet />
      </main>
    </div>
  )
}

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient
}>()({ component: RootLayout })
