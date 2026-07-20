import { useEffect, useRef, useState } from 'react'
import { Sparkles } from 'lucide-react'
import {
  streamChat,
  fetchConversations,
  fetchConversationDetail,
  deleteConversation,
  fetchModels,
} from '../lib/api.js'
import MessageBubble from './MessageBubble.jsx'
import Composer from './Composer.jsx'
import Sidebar from './Sidebar.jsx'
import ConversationList from './ConversationList.jsx'
import ModelSelector from './ModelSelector.jsx'
import SourcesPanel from './SourcesPanel.jsx'

const EXAMPLE_QUESTIONS = [
  'How many days per week can employees work remotely?',
  'What is the progressive discipline policy?',
  'What benefits and perks are offered?',
]

const MODEL_STORAGE_KEY = 'uc1-selected-model'

function mapStoredMessage(message) {
  return {
    id: message.id,
    role: message.role,
    content: message.content,
    streaming: false,
    refused: false,
    injectionFlagged: false,
    citations: message.citations ?? [],
    model: message.model ?? null,
    totalTokens: message.total_tokens ?? null,
  }
}

export default function ChatView() {
  const [conversations, setConversations] = useState([])
  const [activeConversationId, setActiveConversationId] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [models, setModels] = useState([])
  const [selectedModel, setSelectedModel] = useState(() => localStorage.getItem(MODEL_STORAGE_KEY) || '')
  const [sourcesPanel, setSourcesPanel] = useState(null)
  const conversationIdRef = useRef(null)
  const listRef = useRef(null)

  async function loadConversations() {
    try {
      const list = await fetchConversations()
      setConversations(list)
    } catch {
      // sidebar list is non-critical -- leave it empty rather than blocking the chat
    }
  }

  useEffect(() => {
    loadConversations()
    fetchModels()
      .then((list) => {
        setModels(list)
        setSelectedModel((prev) => prev || list.find((m) => m.default)?.id || list[0]?.id || '')
      })
      .catch(() => {})
  }, [])

  function handleSelectModel(modelId) {
    setSelectedModel(modelId)
    localStorage.setItem(MODEL_STORAGE_KEY, modelId)
  }

  function scrollToBottom() {
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
    })
  }

  function handleNewChat() {
    conversationIdRef.current = null
    setActiveConversationId(null)
    setMessages([])
    setInput('')
    setSourcesPanel(null)
  }

  async function handleSelectConversation(id) {
    if (id === activeConversationId) return
    try {
      const detail = await fetchConversationDetail(id)
      conversationIdRef.current = id
      setActiveConversationId(id)
      setMessages(detail.messages.map(mapStoredMessage))
      setSourcesPanel(null)
    } catch {
      // leave current view as-is if the fetch fails
    }
  }

  async function handleDeleteConversation(id) {
    try {
      await deleteConversation(id)
      setConversations((prev) => prev.filter((c) => c.id !== id))
      if (id === activeConversationId) handleNewChat()
    } catch {
      // no-op: sidebar just won't reflect the deletion if the request failed
    }
  }

  async function sendMessage(text) {
    if (!text || sending) return

    const isNewConversation = !conversationIdRef.current
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
    setSending(true)
    scrollToBottom()

    function updateAssistant(patch) {
      setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, ...patch } : m)))
    }

    await streamChat({
      message: text,
      conversationId: conversationIdRef.current,
      model: selectedModel,
      onMeta: (meta) => {
        conversationIdRef.current = meta.conversation_id
        setActiveConversationId(meta.conversation_id)
        if (isNewConversation) loadConversations()
        updateAssistant({
          refused: meta.refused,
          injectionFlagged: meta.injection_flagged,
          citations: meta.citations,
          model: meta.model,
        })
      },
      onDelta: (delta) => {
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + delta } : m)),
        )
        scrollToBottom()
      },
      onDone: (payload) => {
        // Authoritative: retrieval's tentative citations from onMeta may not reflect
        // what the answer actually grounded itself in (see backend soft-refusal check).
        updateAssistant({
          streaming: false,
          totalTokens: payload?.total_tokens ?? null,
          citations: payload?.citations ?? [],
        })
        setSending(false)
      },
      onError: () => {
        updateAssistant({
          streaming: false,
          content: 'Something went wrong reaching the backend. Check that the API is running.',
        })
        setSending(false)
      },
    })
  }

  async function handleSend(overrideText) {
    const text = (typeof overrideText === 'string' ? overrideText : input).trim()
    if (!text) return
    setInput('')
    await sendMessage(text)
  }

  const hasMessages = messages.length > 0

  return (
    <div className="flex h-screen bg-neutral-50 dark:bg-df-navy">
      <Sidebar activePage="chat">
        <ConversationList
          conversations={conversations}
          activeId={activeConversationId}
          onSelect={handleSelectConversation}
          onNew={handleNewChat}
          onDelete={handleDeleteConversation}
        />
      </Sidebar>

      <div className="flex flex-1 flex-col">
        <header className="flex shrink-0 items-center border-b border-neutral-200 px-3 py-2 dark:border-neutral-800">
          <ModelSelector models={models} selected={selectedModel} onSelect={handleSelectModel} />
        </header>

        {!hasMessages ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6">
            <div className="text-center">
              <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-df-yellow via-df-orange to-df-red">
                <Sparkles className="size-7 text-white" strokeWidth={1.75} />
              </div>
              <h1 className="text-2xl font-semibold tracking-tight bg-gradient-to-r from-df-yellow via-df-orange to-df-red bg-clip-text text-transparent">
                Ask about company policy
              </h1>
              <p className="mx-auto mt-2 max-w-md text-sm text-neutral-500">
                Answers are grounded only in the indexed documents — nothing from the model's
                general knowledge.
              </p>
            </div>

            <div className="w-full max-w-2xl">
              <Composer value={input} onChange={setInput} onSubmit={handleSend} sending={sending} autoFocus />
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                {EXAMPLE_QUESTIONS.map((question) => (
                  <button
                    key={question}
                    type="button"
                    onClick={() => handleSend(question)}
                    className="rounded-full border border-neutral-300 bg-white px-3.5 py-1.5 text-xs text-neutral-600 transition hover:border-df-orange/50 hover:text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900/60 dark:text-neutral-300 dark:hover:text-neutral-100"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            <div ref={listRef} className="flex-1 overflow-y-auto">
              <div className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-8">
                {messages.map((message) => (
                  <MessageBubble key={message.id} message={message} onOpenSources={setSourcesPanel} />
                ))}
              </div>
            </div>
            <div className="shrink-0 border-t border-neutral-200 px-6 py-4 dark:border-neutral-800">
              <div className="mx-auto max-w-3xl">
                <Composer value={input} onChange={setInput} onSubmit={handleSend} sending={sending} />
              </div>
            </div>
          </>
        )}
      </div>

      {sourcesPanel && <SourcesPanel citations={sourcesPanel} onClose={() => setSourcesPanel(null)} />}
    </div>
  )
}
