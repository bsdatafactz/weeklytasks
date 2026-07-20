import { useEffect, useState } from 'react'
import { RefreshCw, FileText, CheckCircle2, Clock } from 'lucide-react'
import { fetchDocuments, reindexDocuments } from '../lib/api.js'
import Sidebar from './Sidebar.jsx'
import AnalyticsPanel from './AnalyticsPanel.jsx'
import ThemeToggle from './ThemeToggle.jsx'

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export default function AdminView() {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [reindexing, setReindexing] = useState(false)
  const [error, setError] = useState(null)

  async function loadDocuments() {
    setLoading(true)
    setError(null)
    try {
      const docs = await fetchDocuments()
      setDocuments(docs)
    } catch {
      setError('Could not reach the backend to list indexed documents.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDocuments()
  }, [])

  async function handleReindex() {
    setReindexing(true)
    setError(null)
    try {
      await reindexDocuments()
      await loadDocuments()
    } catch {
      setError('Re-index failed. Check the backend logs.')
    } finally {
      setReindexing(false)
    }
  }

  const totalChunks = documents.reduce((sum, d) => sum + (d.chunk_count ?? 0), 0)

  return (
    <div className="flex h-screen bg-neutral-50 dark:bg-df-navy">
      <Sidebar activePage="admin" />

      <div className="flex flex-1 flex-col">
        <header className="flex shrink-0 items-center justify-end border-b border-neutral-200 px-3 py-2 dark:border-neutral-800">
          <ThemeToggle />
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="mx-auto flex max-w-5xl flex-col gap-8">
          <section className="flex flex-col gap-4">
            <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Usage analytics</h1>
            <AnalyticsPanel />
          </section>

          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Indexed documents</h2>
                <p className="text-sm text-neutral-500">
                  {documents.length} documents · {totalChunks} chunks
                </p>
              </div>
              <button
                type="button"
                onClick={handleReindex}
                disabled={reindexing}
                className="inline-flex items-center gap-2 rounded-md bg-df-orange px-4 py-2 text-sm font-medium text-white transition hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`size-4 ${reindexing ? 'animate-spin' : ''}`} strokeWidth={1.75} />
                {reindexing ? 'Re-indexing…' : 'Re-index'}
              </button>
            </div>

            {error && (
              <div className="rounded-md border border-df-red/40 bg-df-red/10 px-4 py-2.5 text-sm text-red-700 dark:text-red-200">
                {error}
              </div>
            )}

            <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden dark:border-neutral-800 dark:bg-neutral-900/60">
              {loading ? (
                <p className="px-4 py-6 text-center text-sm text-neutral-500">Loading…</p>
              ) : documents.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-neutral-500">
                  No documents indexed yet — click re-index to run ingestion.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-neutral-200 text-left text-xs uppercase tracking-wide text-neutral-500 dark:border-neutral-800">
                        <th className="px-4 py-3 font-medium">Document</th>
                        <th className="px-4 py-3 font-medium">Format</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                        <th className="px-4 py-3 font-medium">Chunks</th>
                        <th className="px-4 py-3 font-medium">Indexed at</th>
                      </tr>
                    </thead>
                    <tbody>
                      {documents.map((doc) => (
                        <tr
                          key={doc.id}
                          className="border-b border-neutral-100 last:border-0 dark:border-neutral-800/60"
                        >
                          <td className="px-4 py-3 text-neutral-800 dark:text-neutral-200">
                            <span className="inline-flex items-center gap-2">
                              <FileText className="size-3.5 shrink-0 text-df-orange" strokeWidth={1.75} />
                              {doc.filename}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-neutral-500 uppercase text-xs dark:text-neutral-400">
                            {doc.format}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center gap-1.5 text-xs ${
                                doc.status === 'indexed'
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : 'text-neutral-500'
                              }`}
                            >
                              {doc.status === 'indexed' ? (
                                <CheckCircle2 className="size-3.5" strokeWidth={1.75} />
                              ) : (
                                <Clock className="size-3.5" strokeWidth={1.75} />
                              )}
                              {doc.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-neutral-500 dark:text-neutral-400">{doc.chunk_count}</td>
                          <td className="px-4 py-3 text-neutral-400 text-xs dark:text-neutral-500">
                            {formatDate(doc.indexed_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        </div>
        </div>
      </div>
    </div>
  )
}
