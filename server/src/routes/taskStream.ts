import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import Task from '../models/Task';

const router = Router();
router.use(authenticate);

// GET /workspaces/:workspaceId/tasks/stream - SSE stream for task updates
router.get('/workspaces/:workspaceId/tasks/stream', async (req: Request, res: Response): Promise<void> => {
  const { workspaceId } = req.params;
  const { since } = req.query as { since?: string };

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  let lastCheck = since ? new Date(since) : new Date();
  const seenIds = new Set<string>();
  let closed = false;

  req.on('close', () => {
    closed = true;
  });

  const poll = async () => {
    if (closed) return;

    try {
      const tasks = await Task.find({
        workspaceId,
        updatedAt: { $gte: lastCheck },
      }).sort({ updatedAt: -1 });

      for (const task of tasks) {
        const idStr = task._id.toString();
        const eventType = seenIds.has(idStr) ? 'task.updated' : 'task.new';
        seenIds.add(idStr);

        res.write(`event: ${eventType}\n`);
        res.write(`data: ${JSON.stringify(task)}\n\n`);
      }

      if (tasks.length > 0) {
        lastCheck = new Date();
      }
    } catch (err) {
      console.error('[SSE] Task stream error:', err);
    }

    if (!closed) {
      setTimeout(poll, 2000);
    }
  };

  res.write(`:keepalive\n\n`);
  poll();
});

export default router;
