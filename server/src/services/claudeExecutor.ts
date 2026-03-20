import { EventEmitter } from 'events';
import Execution from '../models/Execution';
import { openclawStream, openclawHealthCheck } from './openclawClient';
import type { OpenClawMessage } from './openclawClient';

export interface ExecutionRequest {
  executionId: string;
  prompt: string;
  model?: string;
  allowedTools?: string[];
  workingDirectory?: string;
  maxTurns?: number;
  systemPrompt?: string;
}

export interface StreamEvent {
  executionId: string;
  type: 'text' | 'tool_use' | 'tool_result' | 'error' | 'status' | 'complete';
  content: string;
  toolName?: string;
  toolInput?: any;
  timestamp: number;
}

const PLAN_LIMITS: Record<string, number> = {
  free: 1,
  pro: 5,
  enterprise: 20,
};

class ClaudeExecutor extends EventEmitter {
  private activeExecutions: Map<string, AbortController> = new Map();
  private orgRunningCount: Map<string, number> = new Map();

  canExecute(orgId: string, plan: string = 'free'): boolean {
    const current = this.orgRunningCount.get(orgId) || 0;
    return current < (PLAN_LIMITS[plan] || 1);
  }

  getActiveCount(orgId: string): number {
    return this.orgRunningCount.get(orgId) || 0;
  }

  async execute(req: ExecutionRequest): Promise<void> {
    const execution = await Execution.findById(req.executionId);
    if (!execution) throw new Error('Execution not found');

    const orgId = execution.orgId.toString();

    // Verify OpenClaw gateway is reachable
    const available = await openclawHealthCheck();
    if (!available) {
      execution.status = 'failed';
      execution.error = 'OpenClaw gateway is not reachable. Start it with: openclaw gateway start';
      await execution.save();
      this.emitStream(req.executionId, 'error', execution.error);
      return;
    }

    execution.status = 'running';
    execution.startedAt = new Date();
    await execution.save();

    this.emitStream(req.executionId, 'status', 'running');
    this.orgRunningCount.set(orgId, (this.orgRunningCount.get(orgId) || 0) + 1);

    const startTime = Date.now();
    const abortController = new AbortController();
    this.activeExecutions.set(req.executionId, abortController);

    try {
      const messages: OpenClawMessage[] = [];

      if (req.systemPrompt) {
        messages.push({ role: 'system', content: req.systemPrompt });
      }
      messages.push({ role: 'user', content: req.prompt });

      let fullResult = '';

      for await (const chunk of openclawStream({ messages, maxTokens: 4096 })) {
        if (abortController.signal.aborted) break;

        if (chunk.type === 'delta') {
          fullResult += chunk.content;
          this.emitStream(req.executionId, 'text', chunk.content);
          execution.logs.push({
            timestamp: new Date(),
            type: 'text',
            content: chunk.content,
          });
        } else if (chunk.type === 'error') {
          throw new Error(chunk.content);
        }
      }

      execution.status = 'completed';
      execution.result = fullResult || '(no output)';
      execution.completedAt = new Date();
      execution.usage.durationMs = Date.now() - startTime;
      await execution.save();

      this.emitStream(req.executionId, 'complete', fullResult || '(no output)');

    } catch (err: any) {
      execution.status = abortController.signal.aborted ? 'aborted' : 'failed';
      execution.error = err.message;
      execution.completedAt = new Date();
      execution.usage.durationMs = Date.now() - startTime;
      await execution.save();

      this.emitStream(req.executionId, 'error', err.message);

    } finally {
      this.activeExecutions.delete(req.executionId);
      const current = this.orgRunningCount.get(orgId) || 1;
      if (current <= 1) this.orgRunningCount.delete(orgId);
      else this.orgRunningCount.set(orgId, current - 1);
    }
  }

  async abort(executionId: string): Promise<boolean> {
    const controller = this.activeExecutions.get(executionId);
    if (!controller) return false;

    controller.abort();
    this.activeExecutions.delete(executionId);

    const execution = await Execution.findById(executionId);
    if (execution) {
      execution.status = 'aborted';
      execution.completedAt = new Date();
      await execution.save();
    }

    this.emitStream(executionId, 'status', 'aborted');
    return true;
  }

  private emitStream(executionId: string, type: StreamEvent['type'], content: string): void {
    this.emit('stream', { executionId, type, content, timestamp: Date.now() } as StreamEvent);
  }

  getActiveExecutions(): string[] {
    return Array.from(this.activeExecutions.keys());
  }

  isRunning(executionId: string): boolean {
    return this.activeExecutions.has(executionId);
  }
}

export const executor = new ClaudeExecutor();
