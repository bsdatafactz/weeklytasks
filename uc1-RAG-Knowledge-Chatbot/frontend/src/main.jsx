import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.jsx'
import { applyTheme, getStoredTheme } from './lib/theme.js'

// Applied before the first paint so there's no flash of the wrong theme.
applyTheme(getStoredTheme())

// Shared cache for documents/analytics/conversations/models -- lives outside any
// component so it survives navigating between Chat and Admin instead of refetching
// from scratch on every mount. staleTime matches how long the Azure free-tier
// backend takes to go stale-but-not-worth-a-refetch between page switches.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 4,
      retryDelay: (attempt) => 1500 * 2 ** attempt,
    },
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
