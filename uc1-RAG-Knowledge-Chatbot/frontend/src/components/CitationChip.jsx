import { useState } from 'react'
import { FileText, ChevronDown } from 'lucide-react'

export default function CitationChip({ citation }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="rounded-lg border border-neutral-200 bg-white overflow-hidden dark:border-neutral-800 dark:bg-neutral-900/60">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-left text-xs text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 transition dark:text-neutral-400 dark:hover:bg-neutral-800/60 dark:hover:text-neutral-200"
      >
        <FileText className="size-3 shrink-0 text-df-orange" strokeWidth={1.75} />
        <span className="max-w-[220px] truncate">{citation.filename}</span>
        <span className="text-neutral-400 dark:text-neutral-600">·</span>
        <span className="max-w-[140px] truncate text-neutral-400 dark:text-neutral-500">{citation.chunk_ref}</span>
        <ChevronDown
          className={`size-3 shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}
          strokeWidth={1.75}
        />
      </button>
      {expanded && (
        <div className="max-w-md border-t border-neutral-200 bg-neutral-50 px-3 py-2.5 text-xs text-neutral-500 dark:border-neutral-800 dark:bg-neutral-950/40 dark:text-neutral-400">
          {citation.snippet}
        </div>
      )}
    </div>
  )
}
