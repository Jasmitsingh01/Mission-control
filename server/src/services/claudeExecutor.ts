import { EventEmitter } from 'events';
import Execution from '../models/Execution';
import { openclawStream, openclawHealthCheck, openclawRespond } from './openclawClient';
import type { OpenClawMessage, InteractionRequest, Artifact } from './openclawClient';

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
  type: 'text' | 'tool_use' | 'tool_result' | 'error' | 'status' | 'complete' | 'interaction_request' | 'interaction_response' | 'artifact';
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

  // Bidirectional: pending interaction resolvers (executionId:requestId -> resolve fn)
  private pendingResolvers: Map<string, (response: any) => void> = new Map();
  // Collected artifacts per execution
  private executionArtifacts: Map<string, Artifact[]> = new Map();
  // Pending interaction requests per execution
  private pendingInteractions: Map<string, InteractionRequest[]> = new Map();

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
    this.executionArtifacts.set(req.executionId, []);
    this.pendingInteractions.set(req.executionId, []);

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

        } else if (chunk.type === 'interaction_request') {
          // Agent needs user input — pause stream and wait for response
          const interactionReq: InteractionRequest = JSON.parse(chunk.content);
          const pending = this.pendingInteractions.get(req.executionId) || [];
          pending.push(interactionReq);
          this.pendingInteractions.set(req.executionId, pending);

          this.emitStream(req.executionId, 'interaction_request', chunk.content);
          execution.logs.push({
            timestamp: new Date(),
            type: 'system' as any,
            content: `[WAITING] ${interactionReq.title}: ${interactionReq.description}`,
          });

          // Pause: wait for user to respond
          const userResponse = await new Promise<any>((resolve) => {
            const key = `${req.executionId}:${interactionReq.requestId}`;
            this.pendingResolvers.set(key, resolve);

            // Auto-timeout after 10 minutes
            setTimeout(() => {
              if (this.pendingResolvers.has(key)) {
                this.pendingResolvers.delete(key);
                resolve({ timeout: true, message: 'No response received — continuing with default.' });
              }
            }, 10 * 60 * 1000);
          });

          // Send response back to OpenClaw and resume
          await openclawRespond(interactionReq.requestId, userResponse);
          this.emitStream(req.executionId, 'interaction_response', JSON.stringify({
            requestId: interactionReq.requestId,
            response: userResponse,
          }));

          // Remove from pending
          const updatedPending = (this.pendingInteractions.get(req.executionId) || [])
            .filter((r) => r.requestId !== interactionReq.requestId);
          this.pendingInteractions.set(req.executionId, updatedPending);

          execution.logs.push({
            timestamp: new Date(),
            type: 'system' as any,
            content: `[RESPONDED] ${interactionReq.title}`,
          });

        } else if (chunk.type === 'artifact') {
          // Agent produced a file/artifact
          const artifact: Artifact = JSON.parse(chunk.content);
          const artifacts = this.executionArtifacts.get(req.executionId) || [];
          artifacts.push(artifact);
          this.executionArtifacts.set(req.executionId, artifacts);

          this.emitStream(req.executionId, 'artifact', chunk.content);
          execution.logs.push({
            timestamp: new Date(),
            type: 'system' as any,
            content: `[ARTIFACT] ${artifact.name} (${artifact.type})`,
          });

        } else if (chunk.type === 'error') {
          throw new Error(chunk.content);
        }
      }

      execution.status = 'completed';
      execution.result = fullResult || '(no output)';
      execution.completedAt = new Date();
      execution.usage.durationMs = Date.now() - startTime;

      // Attach artifact summary to result
      const artifacts = this.executionArtifacts.get(req.executionId) || [];
      if (artifacts.length > 0) {
        execution.result += `\n\n--- Artifacts (${artifacts.length}) ---\n` +
          artifacts.map((a) => `- ${a.name} (${a.type}${a.size ? `, ${a.size} bytes` : ''}): ${a.path}`).join('\n');
      }

      await execution.save();

      // Emit completion with artifact info
      this.emitStream(req.executionId, 'complete', JSON.stringify({
        result: fullResult || '(no output)',
        artifacts,
      }));

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

      // Cleanup pending resolvers for this execution
      for (const key of this.pendingResolvers.keys()) {
        if (key.startsWith(req.executionId + ':')) {
          this.pendingResolvers.delete(key);
        }
      }

      // Keep artifacts for 10 minutes after completion for retrieval
      setTimeout(() => {
        this.executionArtifacts.delete(req.executionId);
        this.pendingInteractions.delete(req.executionId);
      }, 10 * 60 * 1000);
    }
  }

  /**
   * Respond to an interaction request from the user.
   * Resumes the paused stream.
   */
  respondToInteraction(executionId: string, requestId: string, response: any): boolean {
    const key = `${executionId}:${requestId}`;
    const resolver = this.pendingResolvers.get(key);
    if (!resolver) return false;

    resolver(response);
    this.pendingResolvers.delete(key);
    return true;
  }

  /**
   * Get pending interaction requests for an execution.
   */
  getPendingInteractions(executionId: string): InteractionRequest[] {
    return this.pendingInteractions.get(executionId) || [];
  }

  /**
   * Get collected artifacts for an execution.
   */
  getArtifacts(executionId: string): Artifact[] {
    return this.executionArtifacts.get(executionId) || [];
  }

  async abort(executionId: string): Promise<boolean> {
    const controller = this.activeExecutions.get(executionId);
    if (!controller) return false;

    controller.abort();
    this.activeExecutions.delete(executionId);

    // Resolve any pending interactions so the stream unblocks
    for (const key of this.pendingResolvers.keys()) {
      if (key.startsWith(executionId + ':')) {
        const resolver = this.pendingResolvers.get(key);
        resolver?.({ aborted: true });
        this.pendingResolvers.delete(key);
      }
    }

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
