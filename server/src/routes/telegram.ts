import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import User from '../models/User';
import { generateLinkCode } from '../services/telegramBot';

const router = Router();

// All telegram routes require authentication
router.use(authenticate);

// POST /api/telegram/generate-link-code
router.post('/generate-link-code', async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const code = generateLinkCode(userId);
    res.json({ code, expiresIn: 300 });
  } catch (err) {
    console.error('[Telegram Route] Generate link code error:', err);
    res.status(500).json({ error: 'Failed to generate link code.' });
  }
});

// GET /api/telegram/status
router.get('/status', async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.userId).select('telegramChatId telegramLinkedAt').lean();
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }
    res.json({
      linked: !!user.telegramChatId,
      linkedAt: user.telegramLinkedAt || null,
    });
  } catch (err) {
    console.error('[Telegram Route] Status error:', err);
    res.status(500).json({ error: 'Failed to check Telegram status.' });
  }
});

// DELETE /api/telegram/unlink
router.delete('/unlink', async (req: Request, res: Response) => {
  try {
    await User.findByIdAndUpdate(req.userId, {
      telegramChatId: null,
      telegramLinkedAt: null,
    });
    res.json({ success: true });
  } catch (err) {
    console.error('[Telegram Route] Unlink error:', err);
    res.status(500).json({ error: 'Failed to unlink Telegram.' });
  }
});

export default router;
