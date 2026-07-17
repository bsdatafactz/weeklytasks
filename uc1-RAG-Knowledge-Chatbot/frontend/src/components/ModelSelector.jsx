import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Check, Sparkles } from 'lucide-react'

export default function ModelSelector({ models, selected, onSelect }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const current = models.find((m) => m.id === selected)

  if (models.length === 0) return null

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-neutral-700 transition hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-900"
      >
        <Sparkles className="size-3.5 text-df-orange" strokeWidth={1.75} />
        {current?.label ?? selected}
        <ChevronDown className="size-3.5 text-neutral-500" strokeWidth={1.75} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-10 mt-1 w-56 overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-xl dark:border-neutral-800 dark:bg-neutral-900">
          {models.map((model) => (
            <button
              key={model.id}
              type="button"
              onClick={() => {
                onSelect(model.id)
                setOpen(false)
              }}
              className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm text-neutral-700 transition hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800"
            >
              <span>{model.label}</span>
              {model.id === selected && <Check className="size-3.5 text-df-orange" strokeWidth={2} />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
