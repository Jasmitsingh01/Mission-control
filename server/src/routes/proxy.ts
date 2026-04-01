import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import User from '../models/User';
import ApiUsage from '../models/ApiUsage';

const router = Router();

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const REQUEST_TIMEOUT_MS = 90_000; // 90s timeout

function getOpenRouterKey(): string {
  return process.env.OPENROUTER_API_KEY || '';
}

function getOpenRouterModel(): string {
  return process.env.OPENROUTER_DEFAULT_MODEL || 'google/gemini-2.0-flash-001';
}

// All proxy routes require authentication
router.use(authenticate);

// POST /chat - proxy to OpenRouter (non-streaming, optimized)
router.post('/chat', async (req: Request, res: Response): Promise<void> => {
  try {
    const { systemPrompt, userMessage, model, temperature, maxTokens } = req.body;

    if (!userMessage) {
      res.status(400).json({ error: 'userMessage is required.' });
      return;
    }

    // Get user settings for API key override
    const user = await User.findById(req.userId).select('settings').lean();
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    const apiKey = (user as any).settings?.openrouterApiKey || getOpenRouterKey();
    if (!apiKey) {
      res.status(400).json({ error: 'No OpenRouter API key configured. Set one in your settings or contact an admin.' });
      return;
    }

    const selectedModel = model || (user as any).settings?.preferredModel || getOpenRouterModel();
    const selectedTemperature = temperature ?? (user as any).settings?.temperature ?? 0.4;
    const selectedMaxTokens = maxTokens ?? (user as any).settings?.maxTokens ?? 4096;

    // Build messages array
    const messages: Array<{ role: string; content: string }> = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: userMessage });

    // Call OpenRouter with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': 'http://localhost:5173',
        'X-Title': 'AgentForge Mission Control',
      },
      body: JSON.stringify({
        model: selectedModel,
        messages,
        temperature: selectedTemperature,
        max_tokens: selectedMaxTokens,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('OpenRouter error:', response.status, errorBody);
      res.status(response.status).json({
        error: 'OpenRouter API request failed.',
        details: errorBody,
      });
      return;
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string }; text?: string }>;
      model?: string;
      usage?: { total_tokens?: number; prompt_tokens?: number; completion_tokens?: number };
    };

    // Extract response text
    const responseText =
      data.choices?.[0]?.message?.content || data.choices?.[0]?.text || '';

    // Send response immediately, track usage async
    res.json({
      text: responseText,
      model: data.model || selectedModel,
      usage: data.usage || null,
    });

    // Track usage in background (don't block response)
    const tokensUsed = (data.usage?.total_tokens || 0) as number;
    const promptTokens = (data.usage?.prompt_tokens || 0) as number;
    const completionTokens = (data.usage?.completion_tokens || 0) as number;
    const costEstimate = (promptTokens * 0.000001 + completionTokens * 0.000002);
    const today = new Date().toISOString().split('T')[0];

    ApiUsage.findOneAndUpdate(
      { userId: req.userId, date: today },
      { $inc: { requestCount: 1, tokensUsed, costEstimate } },
      { upsert: true, new: true }
    ).catch((err: unknown) => console.error('Failed to track API usage:', err));

  } catch (err: any) {
    if (err.name === 'AbortError') {
      res.status(504).json({ error: 'Request to AI provider timed out. Try again or use a faster model.' });
      return;
    }
    console.error('Proxy chat error:', err);
    res.status(500).json({ error: 'Failed to proxy request to AI provider.' });
  }
});

// POST /chat/stream - streaming proxy to OpenRouter (SSE)
router.post('/chat/stream', async (req: Request, res: Response): Promise<void> => {
  try {
    const { systemPrompt, userMessage, model, temperature, maxTokens } = req.body;

    if (!userMessage) {
      res.status(400).json({ error: 'userMessage is required.' });
      return;
    }

    const user = await User.findById(req.userId).select('settings').lean();
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    const apiKey = (user as any).settings?.openrouterApiKey || getOpenRouterKey();
    if (!apiKey) {
      res.status(400).json({ error: 'No OpenRouter API key configured.' });
      return;
    }

    const selectedModel = model || (user as any).settings?.preferredModel || getOpenRouterModel();
    const selectedTemperature = temperature ?? (user as any).settings?.temperature ?? 0.4;
    const selectedMaxTokens = maxTokens ?? (user as any).settings?.maxTokens ?? 4096;

    const messages: Array<{ role: string; content: string }> = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: userMessage });

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    // Handle client disconnect
    req.on('close', () => {
      controller.abort();
      clearTimeout(timeout);
    });

    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': 'http://localhost:5173',
        'X-Title': 'AgentForge Mission Control',
      },
      body: JSON.stringify({
        model: selectedModel,
        messages,
        temperature: selectedTemperature,
        max_tokens: selectedMaxTokens,
        stream: true,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorBody = await response.text();
      res.write(`data: ${JSON.stringify({ error: true, message: errorBody })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
      return;
    }

    if (!response.body) {
      res.write(`data: ${JSON.stringify({ error: true, message: 'No response body' })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
      return;
    }

    let fullText = '';
    let totalPromptTokens = 0;
    let totalCompletionTokens = 0;

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;

          const payload = trimmed.slice(6);
          if (payload === '[DONE]') {
            res.write('data: [DONE]\n\n');
            continue;
          }

          try {
            const chunk = JSON.parse(payload);
            const delta = chunk.choices?.[0]?.delta?.content || '';
            if (delta) {
              fullText += delta;
              res.write(`data: ${JSON.stringify({ text: delta })}\n\n`);
            }
            // Capture usage from final chunk
            if (chunk.usage) {
              totalPromptTokens = chunk.usage.prompt_tokens || 0;
              totalCompletionTokens = chunk.usage.completion_tokens || 0;
            }
          } catch {
            // Skip malformed chunks
          }
        }
      }
    } catch (streamErr: any) {
      if (streamErr.name !== 'AbortError') {
        res.write(`data: ${JSON.stringify({ error: true, message: 'Stream interrupted' })}\n\n`);
      }
    }

    // Send final summary
    res.write(`data: ${JSON.stringify({
      done: true,
      fullText,
      model: selectedModel,
      usage: {
        prompt_tokens: totalPromptTokens,
        completion_tokens: totalCompletionTokens,
        total_tokens: totalPromptTokens + totalCompletionTokens,
      },
    })}\n\n`);
    res.end();

    // Track usage in background
    const tokensUsed = totalPromptTokens + totalCompletionTokens;
    const costEstimate = (totalPromptTokens * 0.000001 + totalCompletionTokens * 0.000002);
    const today = new Date().toISOString().split('T')[0];

    ApiUsage.findOneAndUpdate(
      { userId: req.userId, date: today },
      { $inc: { requestCount: 1, tokensUsed, costEstimate } },
      { upsert: true, new: true }
    ).catch((err: unknown) => console.error('Failed to track API usage:', err));

  } catch (err: any) {
    if (err.name === 'AbortError') {
      res.write(`data: ${JSON.stringify({ error: true, message: 'Request timed out' })}\n\n`);
      res.end();
      return;
    }
    console.error('Proxy stream error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to proxy streaming request.' });
    } else {
      res.write(`data: ${JSON.stringify({ error: true, message: 'Internal error' })}\n\n`);
      res.end();
    }
  }
});

export default router;
