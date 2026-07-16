import { useState } from 'react'
import { MessageCircle, LayoutDashboard } from 'lucide-react'
import ChatView from './components/ChatView.jsx'
import AdminView from './components/AdminView.jsx'

function App() {
  const [view, setView] = useState('chat')

  return (
    <div className="min-h-screen px-6 py-8">
      <div className={`mx-auto transition-[max-width] ${view === 'admin' ? 'max-w-5xl' : 'max-w-3xl'}`}>
        <header className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold tracking-wide text-neutral-400">
              Data<span className="text-df-orange">FactZ</span>
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight bg-gradient-to-r from-df-yellow via-df-orange to-df-red bg-clip-text text-transparent">
              Knowledge chatbot
            </h1>
          </div>

          <nav className="flex gap-1 rounded-md border border-neutral-800 bg-neutral-900/60 p-1">
            <button
              type="button"
              onClick={() => setView('chat')}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition ${
                view === 'chat'
                  ? 'bg-df-orange text-white'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <MessageCircle className="size-3.5" strokeWidth={1.75} />
              Chat
            </button>
            <button
              type="button"
              onClick={() => setView('admin')}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition ${
                view === 'admin'
                  ? 'bg-df-orange text-white'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <LayoutDashboard className="size-3.5" strokeWidth={1.75} />
              Admin
            </button>
          </nav>
        </header>

        <main className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-5 shadow-lg">
          {view === 'chat' ? <ChatView /> : <AdminView />}
        </main>

        <p className="mt-6 text-center text-xs text-neutral-600">
          AI Engineering Internship Program — Week 1: RAG Knowledge Chatbot
        </p>
      </div>
    </div>
  )
}

export default App
