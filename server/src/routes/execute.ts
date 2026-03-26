import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { requireMinRole } from '../middleware/rbac';
import Execution from '../models/Execution';
import Organization from '../models/Organization';
import { executor } from '../services/claudeExecutor';

const router = Router();

// All execution routes require authentication
router.use(authenticate);

// POST / - Start a new execution
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      taskTitle,
      prompt,
      model,
      allowedTools,
      workingDirectory,
      maxTurns,
      systemPrompt,
    } = req.body;

    if (!prompt) {
      res.status(400).json({ error: 'Prompt is required.' });
      return;
    }

    if (!req.orgId) {
      res.status(400).json({ error: 'Organization context required (X-Org-Id header).' });
      return;
    }

    // Check org concurrency limit
    const org = await Organization.findById(req.orgId).lean();
    if (!org) {
      res.status(404).json({ error: 'Organization not found.' });
      return;
    }

    if (!executor.canExecute(req.orgId, org.plan)) {
      const active = executor.getActiveCount(req.orgId);
      res.status(429).json({
        error: `Concurrency limit reached. ${active} task(s) already running. Upgrade plan for more.`,
      });
      return;
    }

    // Create execution record
    const execution = new Execution({
      userId: req.userId,
      orgId: req.orgId,
      taskTitle: taskTitle || 'Untitled Task',
      prompt,
      claudeModel: model || 'claude-sonnet-4-6',
      allowedTools: allowedTools || ['Read', 'Edit', 'Write', 'Bash', 'Glob', 'Grep', 'web_search', 'web_fetch', 'browser'],
      workingDirectory: workingDirectory || process.cwd(),
      status: 'queued',
    });
    await execution.save();

    // Start execution in background (don't await)
    executor.execute({
      executionId: execution._id.toString(),
      prompt,
      model: model || 'claude-sonnet-4-6',
      allowedTools: allowedTools || ['Read', 'Edit', 'Write', 'Bash', 'Glob', 'Grep', 'web_search', 'web_fetch', 'browser'],
      workingDirectory: workingDirectory || process.cwd(),
      maxTurns: maxTurns || 25,
      systemPrompt,
    }).catch((err) => {
      console.error(`Execution ${execution._id} failed:`, err.message);
    });

    res.status(201).json({
      execution: {
        id: execution._id,
        status: 'queued',
        taskTitle: execution.taskTitle,
        createdAt: execution.createdAt,
      },
    });
  } catch (err: any) {
    console.error('Create execution error:', err);
    res.status(500).json({ error: 'Failed to start execution.' });
  }
});

// GET / - List executions for current org
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.orgId) {
      res.status(400).json({ error: 'Organization context required.' });
      return;
    }

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;
    const status = req.query.status as string;

    const filter: Record<string, any> = { orgId: req.orgId };
    if (status) filter.status = status;

    const [executions, total] = await Promise.all([
      Execution.find(filter, {
        prompt: 0,
        logs: 0,
      })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Execution.countDocuments(filter),
    ]);

    res.json({
      executions,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err: any) {
    console.error('List executions error:', err);
    res.status(500).json({ error: 'Failed to fetch executions.' });
  }
});

// GET /:id - Get execution details with logs
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const execution = await Execution.findOne({
      _id: req.params.id as string,
      orgId: req.orgId,
    }).lean();

    if (!execution) {
      res.status(404).json({ error: 'Execution not found.' });
      return;
    }

    res.json({ execution });
  } catch (err: any) {
    console.error('Get execution error:', err);
    res.status(500).json({ error: 'Failed to fetch execution.' });
  }
});

// POST /:id/abort - Abort a running execution
router.post('/:id/abort', async (req: Request, res: Response): Promise<void> => {
  try {
    const execution = await Execution.findOne({
      _id: req.params.id as string,
      orgId: req.orgId,
    });

    if (!execution) {
      res.status(404).json({ error: 'Execution not found.' });
      return;
    }

    if (execution.status !== 'running' && execution.status !== 'queued') {
      res.status(400).json({ error: 'Execution is not running.' });
      return;
    }

    const aborted = await executor.abort(execution._id.toString());

    res.json({
      aborted,
      message: aborted ? 'Execution aborted.' : 'Execution was not running.',
    });
  } catch (err: any) {
    console.error('Abort execution error:', err);
    res.status(500).json({ error: 'Failed to abort execution.' });
  }
});

// POST /:id/respond - Respond to an interaction request (REST fallback for WS)
router.post('/:id/respond', async (req: Request, res: Response): Promise<void> => {
  try {
    const { requestId, response } = req.body;
    if (!requestId) {
      res.status(400).json({ error: 'requestId is required.' });
      return;
    }

    const handled = executor.respondToInteraction(req.params.id as string, requestId, response);
    res.json({ success: handled });
  } catch (err: any) {
    console.error('Respond to interaction error:', err);
    res.status(500).json({ error: 'Failed to process response.' });
  }
});

// GET /:id/artifacts - Get collected artifacts for an execution
router.get('/:id/artifacts', async (req: Request, res: Response): Promise<void> => {
  try {
    const artifacts = executor.getArtifacts(req.params.id as string);
    res.json({ artifacts });
  } catch (err: any) {
    console.error('Get artifacts error:', err);
    res.status(500).json({ error: 'Failed to fetch artifacts.' });
  }
});

// GET /:id/interactions - Get pending interaction requests
router.get('/:id/interactions', async (req: Request, res: Response): Promise<void> => {
  try {
    const interactions = executor.getPendingInteractions(req.params.id as string);
    res.json({ interactions });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch interactions.' });
  }
});

// GET /active/count - Get active execution count for org
router.get('/active/count', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.orgId) {
      res.status(400).json({ error: 'Organization context required.' });
      return;
    }

    res.json({
      active: executor.getActiveCount(req.orgId),
      ids: executor.getActiveExecutions(),
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to get active count.' });
  }
});

export default router;
