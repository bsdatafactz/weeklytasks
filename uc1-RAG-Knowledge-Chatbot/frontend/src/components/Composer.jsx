import { useEffect, useRef } from 'react'
import { ArrowUp, Loader2 } from 'lucide-react'

export default function Composer({ value, onChange, onSubmit, sending, autoFocus }) {
  const textareaRef = useRef(null)

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`
  }, [value])

  function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      onSubmit()
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit()
      }}
      className="flex items-end gap-2 rounded-3xl border border-neutral-800 bg-neutral-900/80 px-4 py-2.5 shadow-lg transition focus-within:border-df-orange/50"
    >
      <textarea
        ref={textareaRef}
        autoFocus={autoFocus}
        rows={1}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask a question about company policy"
        className="max-h-[200px] flex-1 resize-none bg-transparent py-1.5 text-neutral-100 placeholder:text-neutral-500 focus:outline-none"
      />
      <button
        type="submit"
        disabled={sending || !value.trim()}
        className="mb-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-df-orange text-white transition hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {sending ? (
          <Loader2 className="size-4 animate-spin" strokeWidth={2} />
        ) : (
          <ArrowUp className="size-4" strokeWidth={2} />
        )}
      </button>
    </form>
  )
}
