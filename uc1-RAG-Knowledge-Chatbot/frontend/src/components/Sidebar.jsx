import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { SquarePen, Search, Trash2, LayoutDashboard, MessageSquare } from 'lucide-react'

function formatRelative(isoDate) {
  const date = new Date(isoDate)
  const diffMs = Date.now() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export default function Sidebar({ conversations, activeId, onSelect, onNew, onDelete }) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return conversations
    return conversations.filter((c) => c.preview.toLowerCase().includes(q))
  }, [conversations, query])

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-neutral-800 bg-neutral-950/40">
      <div className="flex items-center gap-2 px-4 py-4">
        <p className="text-sm font-semibold tracking-wide text-neutral-400">
          Data<span className="text-df-orange">FactZ</span>
        </p>
      </div>

      <div className="px-3">
        <button
          type="button"
          onClick={onNew}
          className="flex w-full items-center gap-2 rounded-lg border border-neutral-800 px-3 py-2 text-sm text-neutral-200 transition hover:bg-neutral-900"
        >
          <SquarePen className="size-4" strokeWidth={1.75} />
          New chat
        </button>
      </div>

      <div className="mt-3 px-3">
        <div className="flex items-center gap-2 rounded-lg bg-neutral-900/60 px-3 py-1.5">
          <Search className="size-3.5 shrink-0 text-neutral-500" strokeWidth={1.75} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search chats"
            className="w-full bg-transparent text-sm text-neutral-200 placeholder:text-neutral-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="mt-2 flex-1 overflow-y-auto px-3 py-2">
        {filtered.length === 0 ? (
          <p className="px-2 py-4 text-center text-xs text-neutral-600">
            {conversations.length === 0 ? 'No conversations yet' : 'No matches'}
          </p>
        ) : (
          <ul className="flex flex-col gap-0.5">
            {filtered.map((conversation) => (
              <li key={conversation.id} className="group relative">
                <button
                  type="button"
                  onClick={() => onSelect(conversation.id)}
                  className={`flex w-full items-start gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition ${
                    conversation.id === activeId
                      ? 'bg-neutral-800 text-neutral-100'
                      : 'text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200'
                  }`}
                >
                  <MessageSquare className="mt-0.5 size-3.5 shrink-0" strokeWidth={1.75} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate pr-5">{conversation.preview}</span>
                    <span className="block text-xs text-neutral-600">
                      {formatRelative(conversation.created_at)}
                    </span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(conversation.id)
                  }}
                  className="absolute right-1.5 top-2 rounded-md p-1 text-neutral-600 opacity-0 transition hover:bg-neutral-800 hover:text-df-red group-hover:opacity-100"
                  aria-label="Delete conversation"
                >
                  <Trash2 className="size-3.5" strokeWidth={1.75} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="border-t border-neutral-800 px-3 py-3">
        <Link
          to="/admin"
          className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-neutral-400 transition hover:bg-neutral-900 hover:text-neutral-200"
        >
          <LayoutDashboard className="size-4" strokeWidth={1.75} />
          Admin
        </Link>
      </div>
    </aside>
  )
}
