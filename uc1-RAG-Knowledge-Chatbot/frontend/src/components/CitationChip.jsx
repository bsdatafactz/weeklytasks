import { useState } from 'react'
import { FileText, ChevronDown } from 'lucide-react'

export default function CitationChip({ citation }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="rounded-md border border-neutral-800 bg-neutral-900/40 overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-neutral-300 hover:bg-neutral-800/60 transition"
      >
        <FileText className="size-3.5 shrink-0 text-df-orange" strokeWidth={1.75} />
        <span className="flex-1 truncate">
          {citation.filename}
          <span className="text-neutral-500"> — {citation.chunk_ref}</span>
        </span>
        <ChevronDown
          className={`size-3.5 shrink-0 text-neutral-500 transition-transform ${expanded ? 'rotate-180' : ''}`}
          strokeWidth={1.75}
        />
      </button>
      {expanded && (
        <div className="border-t border-neutral-800 bg-neutral-950/40 px-3 py-2.5 text-xs text-neutral-400">
          {citation.snippet}
        </div>
      )}
    </div>
  )
}
