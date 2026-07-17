import { Link } from 'react-router-dom'
import { MessageCircle, LayoutDashboard } from 'lucide-react'
import ThemeToggle from './ThemeToggle.jsx'

/**
 * Shared nav shell for both pages -- Chat and Admin links always render in
 * the exact same top-of-sidebar position regardless of which page you're on,
 * with page-specific content (conversation list, admin quick links, etc.)
 * injected below via children.
 */
export default function Sidebar({ activePage, children }) {
  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-neutral-200 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-950/40">
      <div className="flex items-center gap-2 px-4 py-4">
        <p className="text-sm font-semibold tracking-wide text-neutral-500 dark:text-neutral-400">
          Data<span className="text-df-orange">FactZ</span>
        </p>
      </div>

      <nav className="flex flex-col gap-0.5 px-3">
        <Link
          to="/"
          className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition ${
            activePage === 'chat'
              ? 'bg-neutral-200 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100'
              : 'text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-neutral-200'
          }`}
        >
          <MessageCircle className="size-4" strokeWidth={1.75} />
          Chat
        </Link>
        <Link
          to="/admin"
          className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition ${
            activePage === 'admin'
              ? 'bg-neutral-200 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100'
              : 'text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-neutral-200'
          }`}
        >
          <LayoutDashboard className="size-4" strokeWidth={1.75} />
          Admin
        </Link>
      </nav>

      {children && (
        <div className="mt-2 flex flex-1 flex-col overflow-hidden border-t border-neutral-200 pt-2 dark:border-neutral-800">
          {children}
        </div>
      )}

      <div className="border-t border-neutral-200 px-3 py-3 dark:border-neutral-800">
        <ThemeToggle />
      </div>
    </aside>
  )
}
