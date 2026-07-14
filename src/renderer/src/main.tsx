import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider, createMemoryHistory, createRouter } from '@tanstack/react-router'
import './styles.css'

import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

// Import the generated route tree
import { routeTree } from './routeTree.gen'
import { queryClient } from './integrations/tanstack-query'
import { ThemeProvider } from './lib/theme-provider'
import { QueryClientProvider } from '@tanstack/react-query'

const memoryHistory = createMemoryHistory({
  initialEntries: ['/']
})

// Create a new router instance
const router = createRouter({ routeTree, context: { queryClient }, history: memoryHistory })

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

// Render the app
const rootElement = document.getElementById('root')!
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <ReactQueryDevtools />
          <RouterProvider router={router} />
        </ThemeProvider>
      </QueryClientProvider>
    </StrictMode>
  )
}
