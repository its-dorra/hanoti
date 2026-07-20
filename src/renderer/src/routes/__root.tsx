import { createRootRouteWithContext, Link, Outlet } from '@tanstack/react-router'
import { Users, Package, ShoppingCart, BookOpen, Sun, Moon } from 'lucide-react'
import { useTheme } from '../lib/theme-provider'
import { cn } from '../lib/utils'
import { QueryClient } from '@tanstack/react-query'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger
} from '@/components/ui/sidebar'
import { Button } from '#components/ui/button'

const NAV_ITEMS = [
  { to: '/clients', label: 'العملاء', icon: Users },
  { to: '/products', label: 'المنتجات', icon: Package },
  { to: '/orders', label: 'الطلبات', icon: ShoppingCart },
  { to: '/debt-notebook', label: 'دفتر الديون', icon: BookOpen }
] as const

function RootLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex-1 space-y-4 overflow-y-auto p-6">
        <SidebarTrigger />
        <Outlet />
      </main>
    </SidebarProvider>
  )
}

function AppSidebar() {
  const { theme, toggleTheme } = useTheme()
  return (
    <Sidebar dir="rtl" side="right">
      <SidebarHeader />
      <SidebarContent>
        <SidebarGroup className="gap-1">
          {NAV_ITEMS.map((item) => (
            <SidebarMenuItem key={item.to}>
              <SidebarMenuButton asChild>
                <Link
                  to={item.to}
                  activeProps={{
                    className: 'bg-primary text-primary-foreground bg-primary'
                  }}
                  className="flex items-center gap-2 rounded-md p-2 py-5 text-sm font-medium"
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <Button
          onClick={toggleTheme}
          variant="ghost"
          className={cn('w-full justify-center gap-2', theme === 'dark' && 'bg-muted')}
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
      </SidebarFooter>
    </Sidebar>
  )
}

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient
}>()({ component: RootLayout })
