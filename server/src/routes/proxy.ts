import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import User from '../models/User';
import ApiUsage from '../models/ApiUsage';

const router = Router();

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

function getOpenRouterKey(): string {
  return process.env.OPENROUTER_API_KEY || '';
}

function getOpenRouterModel(): string {
  return process.env.OPENROUTER_DEFAULT_MODEL || 'google/gemini-2.0-flash-001';
}

// All proxy routes require authentication
router.use(authenticate);

// POST /chat - proxy to OpenRouter
router.post('/chat', async (req: Request, res: Response): Promise<void> => {
  try {
    const { systemPrompt, userMessage, model, temperature, maxTokens } = req.body;

    if (!userMessage) {
      res.status(400).json({ error: 'userMessage is required.' });
      return;
    }

    // Get user settings for API key override
    const user = await User.findById(req.userId);
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    const apiKey = user.settings?.openrouterApiKey || getOpenRouterKey();
    if (!apiKey) {
      res.status(400).json({ error: 'No OpenRouter API key configured. Set one in your settings or contact an admin.' });
      return;
    }

    const selectedModel = model || user.settings?.preferredModel || getOpenRouterModel();
    const selectedTemperature = temperature ?? user.settings?.temperature ?? 0.4;
    const selectedMaxTokens = maxTokens ?? user.settings?.maxTokens ?? 4096;

    // Build messages array
    const messages: Array<{ role: string; content: string }> = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: userMessage });

    // Call OpenRouter
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
    });

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

    // Track usage
    const today = new Date().toISOString().split('T')[0];
    const tokensUsed = (data.usage?.total_tokens || 0) as number;
    const promptTokens = (data.usage?.prompt_tokens || 0) as number;
    const completionTokens = (data.usage?.completion_tokens || 0) as number;

    // Rough cost estimate (varies by model, this is a rough average)
    const costEstimate = (promptTokens * 0.000001 + completionTokens * 0.000002);

    try {
      await ApiUsage.findOneAndUpdate(
        { userId: req.userId, date: today },
        {
          $inc: {
            requestCount: 1,
            tokensUsed: tokensUsed,
            costEstimate: costEstimate,
          },
        },
        { upsert: true, new: true }
      );
    } catch (usageErr) {
      console.error('Failed to track API usage:', usageErr);
      // Don't fail the request if usage tracking fails
    }

    res.json({
      text: responseText,
      model: data.model || selectedModel,
      usage: data.usage || null,
    });
  } catch (err: any) {
    console.error('Proxy chat error:', err);
    res.status(500).json({ error: 'Failed to proxy request to AI provider.' });
  }
});

export default router;
