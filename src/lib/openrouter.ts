import { aiApi } from './api'

/** Non-streaming chat completion (waits for full response) */
export async function chatCompletion(
  systemPrompt: string,
  userMessage: string,
): Promise<string> {
  const data = await aiApi.chat(systemPrompt, userMessage)
  return data.text || data.content || ''
}

/** Streaming chat completion with progress callback */
export async function chatCompletionStream(
  systemPrompt: string,
  userMessage: string,
  onChunk: (text: string, accumulated: string) => void,
  options?: { model?: string; signal?: AbortSignal },
): Promise<string> {
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
  const token = localStorage.getItem('mc_auth_token')
  const orgId = localStorage.getItem('mc_current_org_id')

  const response = await fetch(`${API_BASE}/proxy/chat/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(orgId ? { 'X-Org-Id': orgId } : {}),
    },
    body: JSON.stringify({
      systemPrompt,
      userMessage,
      model: options?.model,
    }),
    signal: options?.signal,
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }))
    throw new Error(err.error || 'Streaming request failed')
  }

  if (!response.body) {
    throw new Error('No response body for streaming')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let accumulated = ''
  let fullText = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || !trimmed.startsWith('data: ')) continue

        const payload = trimmed.slice(6)
        if (payload === '[DONE]') continue

        try {
          const data = JSON.parse(payload)

          if (data.error) {
            throw new Error(data.message || 'Stream error')
          }

          if (data.text) {
            accumulated += data.text
            onChunk(data.text, accumulated)
          }

          if (data.done && data.fullText) {
            fullText = data.fullText
          }
        } catch (e: any) {
          if (e.message === 'Stream error' || e.message?.includes('Stream')) {
            throw e
          }
          // Skip malformed chunks
        }
      }
    }
  } finally {
    reader.releaseLock()
  }

  return fullText || accumulated
}
