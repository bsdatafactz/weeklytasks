import { useEffect, useState } from 'react'
import { MessageSquare, MessagesSquare, Coins } from 'lucide-react'
import { fetchAnalytics } from '../lib/api.js'

const MODEL_LABELS = {
  'gpt-5': 'GPT-5',
  'gpt-5.5': 'GPT-5.5',
  'deepseek-v3.2': 'DeepSeek V3.2',
}

function StatTile({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 px-4 py-3.5">
      <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-neutral-500">
        <Icon className="size-3.5" strokeWidth={1.75} />
        {label}
      </div>
      <p className="mt-1.5 text-2xl font-semibold tabular-nums text-neutral-100">{value.toLocaleString()}</p>
    </div>
  )
}

function ModelUsageRow({ row, maxTokens }) {
  const pct = maxTokens > 0 ? Math.max((row.total_tokens / maxTokens) * 100, 3) : 0
  return (
    <div className="flex items-center gap-3">
      <span className="w-28 shrink-0 truncate text-sm text-neutral-300">
        {MODEL_LABELS[row.model] ?? row.model}
      </span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-800">
        <div className="h-full rounded-full bg-df-orange" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-16 shrink-0 text-right text-xs tabular-nums text-neutral-500">
        {row.total_tokens.toLocaleString()}
      </span>
      <span className="w-20 shrink-0 text-right text-xs tabular-nums text-neutral-600">
        {row.message_count} msgs
      </span>
    </div>
  )
}

function MessagesPerDayChart({ series }) {
  const max = Math.max(...series.map((d) => d.count), 1)
  return (
    <div className="flex h-24 items-end gap-1">
      {series.map((day) => {
        const heightPct = (day.count / max) * 100
        return (
          <div key={day.date} className="group relative flex-1">
            <div
              className="mx-auto w-full rounded-t-sm bg-df-orange/70 transition group-hover:bg-df-orange"
              style={{ height: `${Math.max(heightPct, day.count > 0 ? 4 : 1)}%` }}
            />
            <div className="pointer-events-none absolute bottom-full left-1/2 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-md border border-neutral-800 bg-neutral-900 px-2 py-1 text-xs text-neutral-200 opacity-0 shadow-lg transition group-hover:opacity-100">
              {day.count} on {new Date(day.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </div>
          </div>
        )
      })}
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
      <div className="rounded-md border border-df-red/40 bg-df-red/10 px-4 py-2.5 text-sm text-red-200">
        {error}
      </div>
    )
  }

  if (!data) {
    return <p className="text-sm text-neutral-500">Loading analytics…</p>
  }

  const { totals, usage_by_model: usageByModel, messages_per_day: messagesPerDay } = data
  const maxTokens = Math.max(...usageByModel.map((r) => r.total_tokens), 1)

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-3">
        <StatTile icon={MessagesSquare} label="Conversations" value={totals.conversation_count} />
        <StatTile
          icon={MessageSquare}
          label="Messages"
          value={totals.user_message_count + totals.assistant_message_count}
        />
        <StatTile icon={Coins} label="Tokens used" value={totals.total_tokens} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
          <h3 className="mb-3 text-sm font-semibold text-neutral-200">Usage by model</h3>
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

        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
          <h3 className="mb-3 text-sm font-semibold text-neutral-200">Messages, last 14 days</h3>
          <MessagesPerDayChart series={messagesPerDay} />
        </div>
      </div>
    </div>
  )
}
