const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8000'
const API_KEY = import.meta.env.VITE_APP_API_KEY ?? 'dev-local-key'

/** Shared by streamChat and regenerateAnswer -- both POST a body and consume an
 * identically-shaped server-sent-events stream, differing only in endpoint/body. */
async function streamSSE(path, body, { onMeta, onDelta, onDone, onError }) {
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
      },
      body: JSON.stringify(body),
    })

    if (!response.ok || !response.body) {
      throw new Error(`Request failed with status ${response.status}`)
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })

      let boundary = buffer.indexOf('\n\n')
      while (boundary !== -1) {
        const rawEvent = buffer.slice(0, boundary)
        buffer = buffer.slice(boundary + 2)
        const line = rawEvent.split('\n').find((l) => l.startsWith('data: '))
        if (line) {
          const payload = JSON.parse(line.slice('data: '.length))
          if (payload.type === 'meta') onMeta?.(payload)
          else if (payload.type === 'delta') onDelta?.(payload.text)
          else if (payload.type === 'done') onDone?.(payload)
        }
        boundary = buffer.indexOf('\n\n')
      }
    }
  } catch (err) {
    onError?.(err)
  }
}

/**
 * POSTs a chat message and consumes the server-sent-events stream, invoking
 * callbacks as events arrive: onMeta (citations/refused/injection_flagged),
 * onDelta (incremental answer text), onDone.
 */
export async function streamChat({ message, conversationId, model, ...callbacks }) {
  await streamSSE(
    '/api/v1/chat',
    { message, conversation_id: conversationId ?? null, model: model ?? null },
    callbacks,
  )
}

/**
 * Redoes the answer for a question already asked -- deletes and replaces the stale
 * assistant message server-side rather than appending a duplicate question/answer pair.
 */
export async function regenerateAnswer({ messageId, model, ...callbacks }) {
  await streamSSE('/api/v1/chat/regenerate', { message_id: messageId, model: model ?? null }, callbacks)
}

export async function fetchModels() {
  const res = await fetch(`${API_BASE}/api/v1/chat/models`, {
    headers: { 'x-api-key': API_KEY },
  })
  if (!res.ok) throw new Error(`Request failed with status ${res.status}`)
  return res.json()
}

export async function fetchAnalytics() {
  const res = await fetch(`${API_BASE}/api/v1/analytics`, {
    headers: { 'x-api-key': API_KEY },
  })
  if (!res.ok) throw new Error(`Request failed with status ${res.status}`)
  return res.json()
}

export async function fetchDocuments() {
  const res = await fetch(`${API_BASE}/api/v1/documents`, {
    headers: { 'x-api-key': API_KEY },
  })
  if (!res.ok) throw new Error(`Request failed with status ${res.status}`)
  return res.json()
}

export async function reindexDocuments() {
  const res = await fetch(`${API_BASE}/api/v1/documents/reindex`, {
    method: 'POST',
    headers: { 'x-api-key': API_KEY },
  })
  if (!res.ok) throw new Error(`Request failed with status ${res.status}`)
  return res.json()
}

export async function fetchConversations() {
  const res = await fetch(`${API_BASE}/api/v1/conversations`, {
    headers: { 'x-api-key': API_KEY },
  })
  if (!res.ok) throw new Error(`Request failed with status ${res.status}`)
  return res.json()
}

export async function fetchConversationDetail(conversationId) {
  const res = await fetch(`${API_BASE}/api/v1/conversations/${conversationId}`, {
    headers: { 'x-api-key': API_KEY },
  })
  if (!res.ok) throw new Error(`Request failed with status ${res.status}`)
  return res.json()
}

export async function deleteConversation(conversationId) {
  const res = await fetch(`${API_BASE}/api/v1/conversations/${conversationId}`, {
    method: 'DELETE',
    headers: { 'x-api-key': API_KEY },
  })
  if (!res.ok) throw new Error(`Request failed with status ${res.status}`)
}
