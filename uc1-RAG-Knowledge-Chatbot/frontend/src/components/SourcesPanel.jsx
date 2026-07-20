import { X, FileText } from 'lucide-react'

function truncate(text, max = 160) {
  if (!text) return ''
  const clean = text.replace(/\s+/g, ' ').trim()
  return clean.length > max ? `${clean.slice(0, max).trimEnd()}…` : clean
}

export default function SourcesPanel({ citations, onClose }) {
  if (!citations) return null

  return (
    <div className="sources-panel flex w-[340px] shrink-0 flex-col border-l border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
      <div className="flex shrink-0 items-center justify-between border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Sources</h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
        >
          <X className="size-4" strokeWidth={1.75} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <div className="mb-2 px-1 text-xs font-medium text-neutral-400 dark:text-neutral-600">
          Documents · {citations.length}
        </div>
        <div className="flex flex-col gap-2">
          {citations.map((citation, i) => (
            <div
              key={`${citation.document_id}-${i}`}
              className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-900/60"
            >
              <div className="flex items-center gap-1.5 text-xs font-medium text-neutral-800 dark:text-neutral-200">
                <FileText className="size-3.5 shrink-0 text-df-orange" strokeWidth={1.75} />
                <span className="truncate">{citation.filename}</span>
              </div>
              <div className="mt-0.5 truncate text-[11px] text-neutral-400 dark:text-neutral-600">
                {citation.chunk_ref}
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
                {truncate(citation.snippet)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
