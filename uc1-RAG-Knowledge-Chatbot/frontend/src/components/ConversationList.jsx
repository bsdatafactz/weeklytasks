import { SquarePen, Trash2, MessageSquare } from 'lucide-react'

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

export default function ConversationList({ conversations, activeId, onSelect, onNew, onDelete }) {
  return (
    <>
      <div className="px-3">
        <button
          type="button"
          onClick={onNew}
          className="flex w-full items-center gap-2 rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-700 transition hover:bg-neutral-100 dark:border-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-900"
        >
          <SquarePen className="size-4" strokeWidth={1.75} />
          New chat
        </button>
      </div>

      <div className="mt-3 flex-1 overflow-y-auto px-3 py-2">
        {conversations.length === 0 ? (
          <p className="px-2 py-4 text-center text-xs text-neutral-500 dark:text-neutral-600">
            No conversations yet
          </p>
        ) : (
          <ul className="flex flex-col gap-0.5">
            {conversations.map((conversation) => (
              <li key={conversation.id} className="group relative">
                <button
                  type="button"
                  onClick={() => onSelect(conversation.id)}
                  className={`flex w-full items-start gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition ${
                    conversation.id === activeId
                      ? 'bg-neutral-200 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100'
                      : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-neutral-200'
                  }`}
                >
                  <MessageSquare className="mt-0.5 size-3.5 shrink-0" strokeWidth={1.75} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate pr-5">{conversation.preview}</span>
                    <span className="block text-xs text-neutral-400 dark:text-neutral-600">
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
                  className="absolute right-1.5 top-2 rounded-md p-1 text-neutral-400 opacity-0 transition hover:bg-neutral-200 hover:text-df-red group-hover:opacity-100 dark:text-neutral-600 dark:hover:bg-neutral-800"
                  aria-label="Delete conversation"
                >
                  <Trash2 className="size-3.5" strokeWidth={1.75} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}
