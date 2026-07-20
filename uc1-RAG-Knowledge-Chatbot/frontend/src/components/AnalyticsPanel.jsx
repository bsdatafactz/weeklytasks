import { useEffect, useState } from 'react'
import { MessagesSquare, MessageSquare, Coins } from 'lucide-react'
import { fetchAnalytics } from '../lib/api.js'

const MODEL_LABELS = {
  'gpt-5': 'GPT-5',
  'gpt-5.5': 'GPT-5.5',
  'deepseek-v3.2': 'DeepSeek V3.2',
}

function StatTile({ icon: Icon, label, value, sublabel }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white px-4 py-3.5 dark:border-neutral-800 dark:bg-neutral-900/60">
      <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-500">
        <Icon className="size-3.5" strokeWidth={1.75} />
        {label}
      </div>
      <p className="mt-1.5 text-2xl font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
        {value.toLocaleString()}
      </p>
      {sublabel && <p className="mt-0.5 text-xs text-neutral-400 dark:text-neutral-600">{sublabel}</p>}
    </div>
  )
}

function ModelUsageRow({ row, maxTokens }) {
  const pct = maxTokens > 0 ? Math.max((row.total_tokens / maxTokens) * 100, 3) : 0
  return (
    <div className="flex items-center gap-3">
      <span className="w-28 shrink-0 truncate text-sm text-neutral-700 dark:text-neutral-300">
        {MODEL_LABELS[row.model] ?? row.model}
      </span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
        <div className="h-full rounded-full bg-df-orange" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-16 shrink-0 text-right text-xs tabular-nums text-neutral-500 dark:text-neutral-500">
        {row.total_tokens.toLocaleString()}
      </span>
      <span className="w-20 shrink-0 text-right text-xs tabular-nums text-neutral-400 dark:text-neutral-600">
        {row.message_count} msgs
      </span>
    </div>
  )
}

export default function AnalyticsPanel() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchAnalytics()
      .then(setData)
      .catch(() => setError('Could not load analytics.'))
  }, [])

  if (error) {
    return (
      <div className="rounded-md border border-df-red/40 bg-df-red/10 px-4 py-2.5 text-sm text-red-700 dark:text-red-200">
        {error}
      </div>
    )
  }

  if (!data) {
    return <p className="text-sm text-neutral-500">Loading analytics…</p>
  }

  const { totals, usage_by_model: usageByModel } = data
  const maxTokens = Math.max(...usageByModel.map((r) => r.total_tokens), 1)

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-3">
        <StatTile icon={MessagesSquare} label="Conversations" value={totals.conversation_count} />
        <StatTile icon={MessageSquare} label="Questions asked" value={totals.question_count} />
        <StatTile icon={Coins} label="Tokens used" value={totals.total_tokens} />
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900/60">
        <h3 className="mb-1 text-sm font-semibold text-neutral-800 dark:text-neutral-200">Usage by model</h3>
        <p className="mb-3 text-xs text-neutral-400 dark:text-neutral-600">
          Answered questions only — refused questions have no generation model attached.
        </p>
        {usageByModel.length === 0 ? (
          <p className="text-sm text-neutral-500">No model usage recorded yet.</p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {usageByModel.map((row) => (
              <ModelUsageRow key={row.model} row={row} maxTokens={maxTokens} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
