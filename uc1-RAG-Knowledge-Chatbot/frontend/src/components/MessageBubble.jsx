import Markdown from 'react-markdown'
import { ShieldAlert, CircleSlash, Sparkles, Cpu, FileText, RotateCcw } from 'lucide-react'

const MODEL_LABELS = {
  'gpt-5': 'GPT-5',
  'gpt-5.5': 'GPT-5.5',
  'deepseek-v3.2': 'DeepSeek V3.2',
}

// The model cites sources inline as "[filename, chunk_ref]" (see generation_service.SYSTEM_PROMPT)
// so the backend can tell which retrieved chunks it actually used -- but now that there's a
// dedicated Sources panel, showing that raw bracket text in the message itself is just noise.
// Every real citation marker contains a comma ("file.pdf, Page 1"); a plain markdown link
// wouldn't, so this only strips citation-shaped brackets.
//
// This runs on the accumulated text on every streamed delta, not just once the message is
// complete -- a citation bracket often arrives split across two deltas (e.g. one delta ends
// "...policy [file.pdf" and the next continues ", Page 1]. More text"). Between those two
// renders there's a real, currently-open "[" with no closing "]" yet, which the regex above
// can't match -- so the raw bracket text flashes on screen for one frame until the closing
// delta arrives. Stripping a trailing unclosed bracket too closes that gap.
function stripCitationMarkers(text) {
  return text
    .replace(/\[[^\]]*,[^\]]*\]/g, '')
    .replace(/\[[^\]]*$/, '')
    .replace(/[ \t]+([.,;:])/g, '$1')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
}

const markdownComponents = {
  p: ({ children }) => <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>,
  strong: ({ children }) => (
    <strong className="font-semibold text-neutral-950 dark:text-neutral-50">{children}</strong>
  ),
  ul: ({ children }) => <ul className="mb-3 ml-5 list-disc space-y-1">{children}</ul>,
  ol: ({ children }) => <ol className="mb-3 ml-5 list-decimal space-y-1">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  code: ({ children }) => (
    <code className="rounded bg-neutral-200 px-1.5 py-0.5 text-[0.85em] text-df-orange dark:bg-neutral-800">
      {children}
    </code>
  ),
  a: ({ children, href }) => (
    <a href={href} target="_blank" rel="noreferrer" className="text-df-orange underline underline-offset-2">
      {children}
    </a>
  ),
}

function AssistantAvatar() {
  return (
    <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-df-yellow via-df-orange to-df-red">
      <Sparkles className="size-3.5 text-white" strokeWidth={2} />
    </div>
  )
}

export default function MessageBubble({ message, onOpenSources, onRegenerate, canRegenerate }) {
  const isUser = message.role === 'user'

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[75%] rounded-3xl bg-neutral-200 px-4 py-2.5 text-[15px] text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100">
          {message.content}
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-3">
      <AssistantAvatar />
      <div className="min-w-0 flex-1 pt-0.5 text-[15px] text-neutral-800 dark:text-neutral-200">
        {message.injectionFlagged && (
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-md bg-df-red/10 px-2.5 py-1 text-xs text-df-red">
            <ShieldAlert className="size-3.5" strokeWidth={1.75} />
            Prompt-injection attempt detected — answered using only the system's instructions
          </div>
        )}

        {message.refused && !message.streaming && (
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-md bg-neutral-200/70 px-2.5 py-1 text-xs text-neutral-500 dark:bg-neutral-800/60 dark:text-neutral-400">
            <CircleSlash className="size-3.5" strokeWidth={1.75} />
            Out of scope for the indexed knowledge base
          </div>
        )}

        {message.content ? (
          <Markdown components={markdownComponents}>{stripCitationMarkers(message.content)}</Markdown>
        ) : (
          message.streaming && (
            <div className="flex gap-1 py-1">
              <span className="size-1.5 animate-bounce rounded-full bg-neutral-400 [animation-delay:-0.3s] dark:bg-neutral-500" />
              <span className="size-1.5 animate-bounce rounded-full bg-neutral-400 [animation-delay:-0.15s] dark:bg-neutral-500" />
              <span className="size-1.5 animate-bounce rounded-full bg-neutral-400 dark:bg-neutral-500" />
            </div>
          )
        )}

        {message.streaming && message.content && (
          <span className="streaming-cursor ml-0.5 inline-block h-4 w-1.5 translate-y-0.5 bg-df-orange" />
        )}

        {!message.streaming && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {message.citations?.length > 0 && (
              <button
                type="button"
                onClick={() => onOpenSources?.(message.citations)}
                className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs text-neutral-500 transition hover:border-df-orange/50 hover:text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900/60 dark:text-neutral-400 dark:hover:text-neutral-200"
              >
                <FileText className="size-3 text-df-orange" strokeWidth={1.75} />
                Sources · {message.citations.length}
              </button>
            )}

            <button
              type="button"
              onClick={() => onRegenerate?.(message.id)}
              disabled={!canRegenerate}
              className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs text-neutral-500 transition hover:border-df-orange/50 hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-40 dark:border-neutral-800 dark:bg-neutral-900/60 dark:text-neutral-400 dark:hover:text-neutral-200"
            >
              <RotateCcw className="size-3" strokeWidth={1.75} />
              Regenerate
            </button>
          </div>
        )}

        {!message.streaming && message.model && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-neutral-400 dark:text-neutral-600">
            <Cpu className="size-3" strokeWidth={1.75} />
            {MODEL_LABELS[message.model] ?? message.model}
            {message.totalTokens != null && (
              <span className="tabular-nums">· {message.totalTokens.toLocaleString()} tokens</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
