import { useRef, useState } from 'react'
import { Send, Loader2 } from 'lucide-react'
import { streamChat } from '../lib/api.js'
import MessageBubble from './MessageBubble.jsx'

export default function ChatView() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const conversationIdRef = useRef(null)
  const listRef = useRef(null)

  function scrollToBottom() {
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
    })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const text = input.trim()
    if (!text || sending) return

    const userMessage = { id: crypto.randomUUID(), role: 'user', content: text }
    const assistantId = crypto.randomUUID()
    const assistantMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      streaming: true,
      refused: false,
      injectionFlagged: false,
      citations: [],
    }

    setMessages((prev) => [...prev, userMessage, assistantMessage])
    setInput('')
    setSending(true)
    scrollToBottom()

    function updateAssistant(patch) {
      setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, ...patch } : m)))
    }

    await streamChat({
      message: text,
      conversationId: conversationIdRef.current,
      onMeta: (meta) => {
        conversationIdRef.current = meta.conversation_id
        updateAssistant({
          refused: meta.refused,
          injectionFlagged: meta.injection_flagged,
          citations: meta.citations,
        })
      },
      onDelta: (delta) => {
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + delta } : m)),
        )
        scrollToBottom()
      },
      onDone: () => {
        updateAssistant({ streaming: false })
        setSending(false)
      },
      onError: () => {
        updateAssistant({
          streaming: false,
          content: "Something went wrong reaching the backend. Check that the API is running.",
        })
        setSending(false)
      },
    })
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <div ref={listRef} className="flex-1 overflow-y-auto px-1 pb-4">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-neutral-500">
              Ask about company policy, benefits, or procedures — answers are grounded only in
              the indexed documents.
            </p>
          </div>
        ) : (
          <div className="flex min-h-full flex-col justify-end gap-3">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 border-t border-neutral-800 pt-4">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about company policy"
          className="flex-1 rounded-md bg-neutral-800 border border-neutral-700 px-4 py-2.5 text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-df-orange"
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-df-orange px-4 py-2.5 font-medium text-white transition hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {sending ? (
            <Loader2 className="size-4 animate-spin" strokeWidth={1.75} />
          ) : (
            <Send className="size-4" strokeWidth={1.75} />
          )}
        </button>
      </form>
    </div>
  )
}
