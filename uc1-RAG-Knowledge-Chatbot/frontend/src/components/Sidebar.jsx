import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MessageCircle, LayoutDashboard, PanelLeftClose, PanelLeft } from 'lucide-react'

const COLLAPSE_KEY = 'uc1-sidebar-collapsed'

function ToggleButton({ collapsed, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={collapsed ? 'Open sidebar' : 'Close sidebar'}
      className="flex size-8 shrink-0 items-center justify-center rounded-lg text-neutral-500 transition hover:bg-neutral-200 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
    >
      {collapsed ? <PanelLeft className="size-[18px]" strokeWidth={1.75} /> : <PanelLeftClose className="size-[18px]" strokeWidth={1.75} />}
    </button>
  )
}

/**
 * Shared nav shell for both pages -- Chat and Admin links always render in
 * the exact same top-of-sidebar position regardless of which page you're on,
 * with page-specific content (conversation list, admin quick links, etc.)
 * injected below via children. Collapses to an icon-only rail (ChatGPT-style)
 * -- state persists like the theme toggle so it stays collapsed across visits.
 */
export default function Sidebar({ activePage, children }) {
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(COLLAPSE_KEY) === 'true')

  function toggle() {
    setCollapsed((prev) => {
      const next = !prev
      localStorage.setItem(COLLAPSE_KEY, String(next))
      return next
    })
  }

  if (collapsed) {
    return (
      <aside className="flex h-screen w-14 shrink-0 flex-col items-center gap-1 border-r border-neutral-200 bg-neutral-100 py-4 dark:border-neutral-800 dark:bg-neutral-950/40">
        <ToggleButton collapsed onClick={toggle} />
        <div className="mt-2 flex flex-col gap-1">
          <Link
            to="/"
            aria-label="Chat"
            className={`flex size-9 items-center justify-center rounded-lg transition ${
              activePage === 'chat'
                ? 'bg-neutral-200 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100'
                : 'text-neutral-500 hover:bg-neutral-200 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-neutral-200'
            }`}
          >
            <MessageCircle className="size-[18px]" strokeWidth={1.75} />
          </Link>
          <Link
            to="/admin"
            aria-label="Admin"
            className={`flex size-9 items-center justify-center rounded-lg transition ${
              activePage === 'admin'
                ? 'bg-neutral-200 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100'
                : 'text-neutral-500 hover:bg-neutral-200 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-neutral-200'
            }`}
          >
            <LayoutDashboard className="size-[18px]" strokeWidth={1.75} />
          </Link>
        </div>
      </aside>
    )
  }

  return (
    <aside className="flex h-screen w-72 shrink-0 flex-col border-r border-neutral-200 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-950/40">
      <div className="flex items-center justify-between px-4 py-4">
        <p className="text-base font-bold tracking-tight text-neutral-800 dark:text-neutral-100">
          Data<span className="text-df-orange">FactZ</span>
        </p>
        <ToggleButton onClick={toggle} />
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
          <MessageCircle className="size-[18px]" strokeWidth={1.75} />
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
          <LayoutDashboard className="size-[18px]" strokeWidth={1.75} />
          Admin
        </Link>
      </nav>

      {children && (
        <div className="mt-2 flex flex-1 flex-col overflow-hidden border-t border-neutral-200 pt-2 dark:border-neutral-800">
          {children}
        </div>
      )}
    </aside>
  )
}
