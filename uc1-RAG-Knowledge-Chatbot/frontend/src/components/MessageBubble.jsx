import { ShieldAlert, CircleSlash, Loader2 } from 'lucide-react'
import CitationChip from './CitationChip.jsx'

export default function MessageBubble({ message }) {
  const isUser = message.role === 'user'

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-xl bg-df-orange/15 border border-df-orange/30 px-4 py-2.5 text-sm text-neutral-100">
          {message.content}
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-start">
      <div
        className={`max-w-[85%] rounded-xl border px-4 py-3 text-sm ${
          message.refused
            ? 'border-neutral-800 bg-neutral-900/40 text-neutral-400'
            : 'border-neutral-800 bg-neutral-900/60 text-neutral-100'
        }`}
      >
        {message.injectionFlagged && (
          <div className="mb-2 flex items-center gap-1.5 text-xs text-df-red">
            <ShieldAlert className="size-3.5" strokeWidth={1.75} />
            Prompt-injection attempt detected in this message — answered using only the
            system's instructions, not the injected text.
          </div>
        )}

        {message.refused && !message.streaming && (
          <div className="mb-1.5 flex items-center gap-1.5 text-xs text-neutral-500">
            <CircleSlash className="size-3.5" strokeWidth={1.75} />
            Out of scope for the indexed knowledge base
          </div>
        )}

        <p className="whitespace-pre-wrap">
          {message.content}
          {message.streaming && (
            <span className="streaming-cursor ml-0.5 inline-block h-3.5 w-1.5 translate-y-0.5 bg-df-orange" />
          )}
        </p>

        {message.streaming && !message.content && (
          <Loader2 className="size-4 animate-spin text-df-orange" strokeWidth={1.75} />
        )}

        {!message.streaming && message.citations?.length > 0 && (
          <div className="mt-3 flex flex-col gap-1.5">
            {message.citations.map((citation, i) => (
              <CitationChip key={`${citation.document_id}-${i}`} citation={citation} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
