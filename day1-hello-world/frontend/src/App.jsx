import { useState } from 'react'
import { Sparkles, Loader2, Send } from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8000'
const API_KEY = import.meta.env.VITE_APP_API_KEY ?? 'dev-local-key'

function App() {
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState('idle') // idle | loading | error

  async function handleSubmit(event) {
    event.preventDefault()
    if (!name.trim()) return

    setStatus('loading')
    setMessage('')

    try {
      const response = await fetch(`${API_BASE}/api/v1/greet`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY,
        },
        body: JSON.stringify({ name: name.trim() }),
      })

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`)
      }

      const data = await response.json()
      setMessage(data.message)
      setStatus('idle')
    } catch (err) {
      setStatus('error')
      setMessage('Something went wrong reaching the backend. Check that the API is running.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <p className="text-sm font-semibold tracking-wide text-neutral-400">
            Data<span className="text-df-orange">FactZ</span>
          </p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight bg-gradient-to-r from-df-yellow via-df-orange to-df-red bg-clip-text text-transparent">
            Hello, world
          </h1>
          <p className="mt-3 text-neutral-400">
            Day 1 environment check — a FastAPI backend calling an LLM, rendered here.
          </p>
        </div>

        <div className="rounded-xl bg-neutral-900/60 border border-neutral-800 p-6 shadow-lg transition-transform duration-200 hover:-translate-y-1 hover:shadow-xl">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <label htmlFor="name" className="text-sm font-medium text-neutral-300">
              Your name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="rounded-md bg-neutral-800 border border-neutral-700 px-4 py-2.5 text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-df-orange"
            />
            <button
              type="submit"
              disabled={status === 'loading' || !name.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-df-orange px-4 py-2.5 font-medium text-white transition hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status === 'loading' ? (
                <Loader2 className="size-4 animate-spin" strokeWidth={1.75} />
              ) : (
                <Send className="size-4" strokeWidth={1.75} />
              )}
              Say hello
            </button>
          </form>

          {message && (
            <div
              className={`mt-5 flex items-start gap-3 rounded-md border px-4 py-3 text-sm ${
                status === 'error'
                  ? 'border-df-red/40 bg-df-red/10 text-red-200'
                  : 'border-df-orange/30 bg-df-orange/10 text-neutral-100'
              }`}
            >
              <Sparkles className="size-4 mt-0.5 shrink-0 text-df-orange" strokeWidth={1.75} />
              <p>{message}</p>
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-neutral-600">
          AI Engineering Internship Program — Day 1 smoke test
        </p>
      </div>
    </div>
  )
}

export default App
