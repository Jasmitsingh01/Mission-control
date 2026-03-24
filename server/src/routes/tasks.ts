import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import Task from '../models/Task';
import Workspace from '../models/Workspace';
import { openClawService } from '../services/openclawService';

const router = Router();
router.use(authenticate);

// POST / - Create task
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const taskData = req.body;
    const task = new Task(taskData);
    await task.save();

    // Notify OpenClaw
    if (task.workspaceId) {
      const workspace = await Workspace.findById(task.workspaceId);
      if (workspace && workspace.openclawSession?.sessionKey) {
        try {
          openClawService.sendMessage({
            sessionKey: workspace.openclawSession.sessionKey,
            message: `[Task Created] Title: "${task.title}"\nAssigned to: /${task.assignee}\nDescription: ${task.desc}`,
            idempotencyKey: `task-create-${task._id}-${Date.now()}`,
          });
        } catch (ocError) {
          console.error('[OpenClaw] Failed to notify task creation:', ocError);
        }
      }
    }

    res.status(201).json({ success: true, message: 'Task created successfully', task });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// GET / - List tasks
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { workspaceId } = req.query as { workspaceId?: string };
    const query = workspaceId ? { workspaceId } : {};
    const tasks = await Task.find(query);
    res.json({ success: true, tasks });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// GET /:id - Get single task
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      res.status(404).json({ success: false, message: 'Task not found' });
      return;
    }
    res.json({ success: true, task });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// PUT /:id - Update task
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const updateData = req.body;
    const oldTask = await Task.findById(req.params.id);
    const task = await Task.findByIdAndUpdate(req.params.id, updateData, { new: true });

    if (!task) {
      res.status(404).json({ success: false, message: 'Task not found' });
      return;
    }

    // Notify OpenClaw if assignee changed or status changed
    if (task.workspaceId) {
      const workspace = await Workspace.findById(task.workspaceId);
      if (workspace && workspace.openclawSession?.sessionKey) {
        let notificationMsg = '';
        if (oldTask && oldTask.assignee !== task.assignee) {
          notificationMsg = `[Task Reassigned] Title: "${task.title}"\nNew Assignee: /${task.assignee}`;
        } else if (oldTask && oldTask.status !== task.status && task.status === 'inprogress') {
          notificationMsg = `[Task Started] /${task.assignee} is now working on: "${task.title}"`;
        } else if (oldTask && oldTask.progress !== task.progress && task.progress === 100) {
          notificationMsg = `[Task Completed] /${task.assignee} has finished: "${task.title}"`;
        }

        if (notificationMsg) {
          try {
            openClawService.sendMessage({
              sessionKey: workspace.openclawSession.sessionKey,
              message: notificationMsg,
              idempotencyKey: `task-update-${task._id}-${Date.now()}`,
            });
          } catch (ocError) {
            console.error('[OpenClaw] Failed to notify task update:', ocError);
          }
        }
      }
    }

    res.json({ success: true, task });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// DELETE /:id - Delete task
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) {
      res.status(404).json({ success: false, message: 'Task not found' });
      return;
    }
    res.json({ success: true, message: 'Task deleted successfully' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

export default router;
