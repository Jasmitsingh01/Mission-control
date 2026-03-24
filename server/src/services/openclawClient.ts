/**
 * OpenClaw Gateway REST Client
 *
 * Connects to the local OpenClaw gateway at http://127.0.0.1:18789
 * Uses the OpenAI-compatible /v1/chat/completions endpoint with SSE streaming.
 */

const OPENCLAW_URL = process.env.OPENCLAW_GATEWAY_URL || 'http://127.0.0.1:18789';
const OPENCLAW_TOKEN = process.env.OPENCLAW_GATEWAY_TOKEN || '4258d7aabd53e4b68c978bcd600e059917ce253eb9dd0a7d';

export interface InteractionRequest {
  requestId: string;
  type: 'approval' | 'user_input' | 'file_request';
  title: string;
  description: string;
  options?: string[];
  inputSchema?: { fields: { name: string; label: string; type: 'text' | 'textarea' | 'select'; required: boolean; options?: string[] }[] };
}

export interface Artifact {
  name: string;
  path: string;
  type: string;
  size?: number;
  content?: string;
  createdAt: number;
}

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
  type: 'delta' | 'done' | 'error' | 'interaction_request' | 'artifact';
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

        // Handle interaction requests from the gateway (approval, input needed, file request)
        if (chunk.type === 'interaction_request' || chunk.choices?.[0]?.delta?.type === 'interaction_request') {
          const reqData = chunk.data || chunk.choices?.[0]?.delta?.data || chunk;
          yield { type: 'interaction_request', content: JSON.stringify(reqData) };
          continue;
        }

        // Handle artifact events (files produced by the agent)
        if (chunk.type === 'artifact' || chunk.choices?.[0]?.delta?.type === 'artifact') {
          const artData = chunk.data || chunk.choices?.[0]?.delta?.data || chunk;
          yield { type: 'artifact', content: JSON.stringify(artData) };
          continue;
        }

        // Handle tool_use events that signal human input needed
        const toolCall = chunk.choices?.[0]?.delta?.tool_calls?.[0];
        if (toolCall?.function?.name === 'human_input' || toolCall?.function?.name === 'request_approval') {
          const args = toolCall.function.arguments ? JSON.parse(toolCall.function.arguments) : {};
          yield {
            type: 'interaction_request',
            content: JSON.stringify({
              requestId: `ir_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
              type: toolCall.function.name === 'request_approval' ? 'approval' : 'user_input',
              title: args.title || 'Agent needs your input',
              description: args.description || args.question || '',
              options: args.options,
              inputSchema: args.inputSchema,
            }),
          };
          continue;
        }

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
 * Respond to an interaction request (approval, user input, file).
 * Posts the user's response back to the OpenClaw gateway.
 */
export async function openclawRespond(requestId: string, response: any): Promise<boolean> {
  try {
    const res = await fetch(`${OPENCLAW_URL}/v1/interactions/${requestId}/respond`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENCLAW_TOKEN}`,
      },
      body: JSON.stringify({ requestId, response }),
    });
    return res.ok;
  } catch {
    console.error(`[OpenClaw] Failed to respond to interaction ${requestId}`);
    return false;
  }
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
