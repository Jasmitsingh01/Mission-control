/**
 * OpenClaw Gateway REST Client
 *
 * Connects to the local OpenClaw gateway at http://127.0.0.1:18789
 * Uses the OpenAI-compatible /v1/chat/completions endpoint with SSE streaming.
 */

const OPENCLAW_URL = process.env.OPENCLAW_GATEWAY_URL || 'http://127.0.0.1:18789';
const OPENCLAW_TOKEN = process.env.OPENCLAW_GATEWAY_TOKEN || '4258d7aabd53e4b68c978bcd600e059917ce253eb9dd0a7d';

export interface OpenClawMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenClawRequest {
  messages: OpenClawMessage[];
  model?: string;
  maxTokens?: number;
  stream?: boolean;
}

export interface OpenClawChoice {
  index: number;
  message: { role: string; content: string };
  finish_reason: string;
}

export interface OpenClawResponse {
  id: string;
  choices: OpenClawChoice[];
  usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
}

/**
 * Send a non-streaming chat completion to OpenClaw gateway.
 */
export async function openclawChat(req: OpenClawRequest): Promise<OpenClawResponse> {
  const res = await fetch(`${OPENCLAW_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENCLAW_TOKEN}`,
    },
    body: JSON.stringify({
      model: req.model || 'openclaw:main',
      messages: req.messages,
      max_tokens: req.maxTokens || 4096,
      stream: false,
    }),
  });

  if (!res.ok) {
    const errBody: any = await res.json().catch(() => ({ error: { message: res.statusText } }));
    throw new Error(`OpenClaw error: ${errBody.error?.message || res.statusText}`);
  }

  return res.json() as Promise<OpenClawResponse>;
}

/**
 * Send a streaming chat completion to OpenClaw gateway.
 * Returns an async generator that yields SSE chunks.
 */
export async function* openclawStream(req: OpenClawRequest): AsyncGenerator<{
  type: 'delta' | 'done' | 'error';
  content: string;
}> {
  const res = await fetch(`${OPENCLAW_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENCLAW_TOKEN}`,
    },
    body: JSON.stringify({
      model: req.model || 'openclaw:main',
      messages: req.messages,
      max_tokens: req.maxTokens || 4096,
      stream: true,
    }),
  });

  if (!res.ok) {
    const errBody: any = await res.json().catch(() => ({ error: { message: res.statusText } }));
    yield { type: 'error', content: `OpenClaw error: ${errBody.error?.message || res.statusText}` };
    return;
  }

  const reader = res.body?.getReader();
  if (!reader) {
    yield { type: 'error', content: 'No response body' };
    return;
  }

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();

      if (data === '[DONE]') {
        yield { type: 'done', content: '' };
        return;
      }

      try {
        const chunk = JSON.parse(data);
        const delta = chunk.choices?.[0]?.delta?.content;
        if (delta) {
          yield { type: 'delta', content: delta };
        }
      } catch {
        // Skip invalid JSON chunks
      }
    }
  }

  yield { type: 'done', content: '' };
}

/**
 * Invoke a tool directly on the OpenClaw gateway.
 */
export async function openclawToolInvoke(toolName: string, input: any): Promise<any> {
  const res = await fetch(`${OPENCLAW_URL}/tools/invoke`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENCLAW_TOKEN}`,
    },
    body: JSON.stringify({ tool: toolName, input }),
  });

  if (!res.ok) {
    const errBody: any = await res.json().catch(() => ({ error: { message: res.statusText } }));
    throw new Error(`OpenClaw tool error: ${errBody.error?.message || res.statusText}`);
  }

  return res.json();
}

/**
 * Check if the OpenClaw gateway is reachable.
 */
export async function openclawHealthCheck(): Promise<boolean> {
  try {
    const res = await fetch(`${OPENCLAW_URL}/`, { method: 'GET' });
    return res.ok;
  } catch {
    return false;
  }
}
