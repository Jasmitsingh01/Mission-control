import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import Execution, { IExecution } from '../models/Execution';
import { openclawChat, openclawStream, openclawHealthCheck } from './openclawClient';
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
  private activeProcesses: Map<string, ChildProcess | AbortController> = new Map();
  private orgRunningCount: Map<string, number> = new Map();
  private useOpenClaw: boolean = false;

  constructor() {
    super();
    // Check if OpenClaw is available on startup
    this.checkOpenClaw();
  }

  private async checkOpenClaw(): Promise<void> {
    const available = await openclawHealthCheck();
    this.useOpenClaw = available;
    console.log(`[Executor] OpenClaw gateway: ${available ? 'CONNECTED (http://127.0.0.1:18789)' : 'NOT AVAILABLE — falling back to Claude CLI'}`);
  }

  canExecute(orgId: string, plan: string = 'free'): boolean {
    const current = this.orgRunningCount.get(orgId) || 0;
    return current < (PLAN_LIMITS[plan] || 1);
  }

  getActiveCount(orgId: string): number {
    return this.orgRunningCount.get(orgId) || 0;
  }

  async execute(req: ExecutionRequest): Promise<void> {
    // Re-check OpenClaw availability each execution
    const openclawAvailable = await openclawHealthCheck();
    this.useOpenClaw = openclawAvailable;

    if (this.useOpenClaw) {
      return this.executeViaOpenClaw(req);
    }
    return this.executeViaCLI(req);
  }

  // ──────────────────────────────────────────────
  // OPENCLAW GATEWAY EXECUTION (primary)
  // ──────────────────────────────────────────────

  private async executeViaOpenClaw(req: ExecutionRequest): Promise<void> {
    const execution = await Execution.findById(req.executionId);
    if (!execution) throw new Error('Execution not found');

    const orgId = execution.orgId.toString();
    execution.status = 'running';
    execution.startedAt = new Date();
    await execution.save();

    this.emitStream(req.executionId, 'status', 'running (via OpenClaw)');
    this.orgRunningCount.set(orgId, (this.orgRunningCount.get(orgId) || 0) + 1);

    const startTime = Date.now();
    const abortController = new AbortController();
    this.activeProcesses.set(req.executionId, abortController);

    try {
      const messages: OpenClawMessage[] = [];

      if (req.systemPrompt) {
        messages.push({ role: 'system', content: req.systemPrompt });
      }
      messages.push({ role: 'user', content: req.prompt });

      let fullResult = '';

      // Use streaming for real-time output
      for await (const chunk of openclawStream({ messages, maxTokens: 4096 })) {
        // Check abort
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
      this.activeProcesses.delete(req.executionId);
      const current = this.orgRunningCount.get(orgId) || 1;
      if (current <= 1) this.orgRunningCount.delete(orgId);
      else this.orgRunningCount.set(orgId, current - 1);
    }
  }

  // ──────────────────────────────────────────────
  // CLAUDE CLI FALLBACK EXECUTION
  // ──────────────────────────────────────────────

  private async executeViaCLI(req: ExecutionRequest): Promise<void> {
    const execution = await Execution.findById(req.executionId);
    if (!execution) throw new Error('Execution not found');

    const orgId = execution.orgId.toString();
    execution.status = 'running';
    execution.startedAt = new Date();
    await execution.save();

    this.emitStream(req.executionId, 'status', 'running (via Claude CLI)');
    this.orgRunningCount.set(orgId, (this.orgRunningCount.get(orgId) || 0) + 1);

    const startTime = Date.now();

    try {
      const args = this.buildCLIArgs(req);
      const claudePath = process.env.CLAUDE_CLI_PATH || 'claude';

      const proc = spawn(claudePath, args, {
        cwd: req.workingDirectory || execution.workingDirectory || process.cwd(),
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, CI: '1' },
      });

      execution.pid = proc.pid;
      await execution.save();
      this.activeProcesses.set(req.executionId, proc);

      let resultText = '';
      let stdoutBuffer = '';

      proc.stdout!.on('data', (data: Buffer) => {
        stdoutBuffer += data.toString();
        const lines = stdoutBuffer.split('\n');
        stdoutBuffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;
          this.processCLILine(req.executionId, execution, line, (text) => { resultText += text; });
        }
      });

      proc.stderr!.on('data', () => { /* Claude writes progress to stderr */ });

      await new Promise<void>((resolve, reject) => {
        proc.on('close', (code) => {
          this.activeProcesses.delete(req.executionId);
          if (stdoutBuffer.trim()) {
            this.processCLILine(req.executionId, execution, stdoutBuffer, (text) => { resultText += text; });
          }
          if (code === 0 || code === null) resolve();
          else reject(new Error(`Claude exited with code ${code}`));
        });
        proc.on('error', (err) => {
          this.activeProcesses.delete(req.executionId);
          reject(err);
        });
      });

      execution.status = 'completed';
      execution.result = resultText || '(no output)';
      execution.completedAt = new Date();
      execution.usage.durationMs = Date.now() - startTime;
      await execution.save();

      this.emitStream(req.executionId, 'complete', resultText || '(no output)');

    } catch (err: any) {
      execution.status = 'failed';
      execution.error = err.message;
      execution.completedAt = new Date();
      execution.usage.durationMs = Date.now() - startTime;
      await execution.save();
      this.emitStream(req.executionId, 'error', err.message);

    } finally {
      const current = this.orgRunningCount.get(orgId) || 1;
      if (current <= 1) this.orgRunningCount.delete(orgId);
      else this.orgRunningCount.set(orgId, current - 1);
    }
  }

  async abort(executionId: string): Promise<boolean> {
    const handle = this.activeProcesses.get(executionId);
    if (!handle) return false;

    if (handle instanceof AbortController) {
      handle.abort();
    } else {
      // ChildProcess
      handle.kill('SIGTERM');
      setTimeout(() => { if (!handle.killed) handle.kill('SIGKILL'); }, 5000);
    }

    this.activeProcesses.delete(executionId);

    const execution = await Execution.findById(executionId);
    if (execution) {
      execution.status = 'aborted';
      execution.completedAt = new Date();
      await execution.save();
    }

    this.emitStream(executionId, 'status', 'aborted');
    return true;
  }

  private buildCLIArgs(req: ExecutionRequest): string[] {
    const args = ['-p', req.prompt, '--output-format', 'stream-json', '--verbose'];
    if (req.model) args.push('--model', req.model);
    if (req.allowedTools?.length) args.push('--allowedTools', req.allowedTools.join(','));
    if (req.maxTurns) args.push('--max-turns', String(req.maxTurns));
    if (req.systemPrompt) args.push('--append-system-prompt', req.systemPrompt);
    return args;
  }

  private processCLILine(executionId: string, execution: IExecution, line: string, appendResult: (text: string) => void): void {
    try {
      const event = JSON.parse(line);

      if (event.type === 'system' && event.subtype === 'init') {
        execution.claudeSessionId = event.session_id;
        this.emitStream(executionId, 'status', `Session started (${event.model})`);
        return;
      }

      if (event.type === 'assistant' && event.message?.content) {
        for (const block of event.message.content) {
          if (block.type === 'text' && block.text) {
            this.emitStream(executionId, 'text', block.text);
            execution.logs.push({ timestamp: new Date(), type: 'text', content: block.text });
          }
          if (block.type === 'tool_use') {
            const inputStr = block.input?.command || block.input?.pattern || block.input?.file_path || JSON.stringify(block.input || {}).slice(0, 200);
            this.emit('stream', { executionId, type: 'tool_use', content: `${block.name}: ${inputStr}`, toolName: block.name, toolInput: block.input, timestamp: Date.now() } as StreamEvent);
            execution.logs.push({ timestamp: new Date(), type: 'tool_use', content: `${block.name}: ${inputStr}`, toolName: block.name, toolInput: block.input });
          }
        }
        return;
      }

      if (event.type === 'user' && event.message?.content) {
        for (const block of event.message.content) {
          if (block.type === 'tool_result') {
            const content = (typeof block.content === 'string' ? block.content : JSON.stringify(block.content || '')).slice(0, 2000);
            this.emitStream(executionId, 'tool_result', content);
            execution.logs.push({ timestamp: new Date(), type: 'tool_result', content });
          }
        }
        if (event.tool_use_result?.stdout) {
          this.emitStream(executionId, 'tool_result', event.tool_use_result.stdout.slice(0, 2000));
        }
        return;
      }

      if (event.type === 'result') {
        if (event.result) appendResult(event.result);
        if (event.session_id) execution.claudeSessionId = event.session_id;
        if (event.total_cost_usd) execution.usage.costUsd = event.total_cost_usd;
        if (event.duration_ms) execution.usage.durationMs = event.duration_ms;
        if (event.num_turns) execution.usage.totalTurns = event.num_turns;
        if (event.usage) {
          execution.usage.inputTokens = (event.usage.input_tokens || 0) + (event.usage.cache_read_input_tokens || 0);
          execution.usage.outputTokens = event.usage.output_tokens || 0;
        }
        return;
      }
    } catch {
      if (line.trim()) {
        appendResult(line);
        this.emitStream(executionId, 'text', line);
      }
    }
  }

  private emitStream(executionId: string, type: StreamEvent['type'], content: string): void {
    this.emit('stream', { executionId, type, content, timestamp: Date.now() } as StreamEvent);
  }

  getActiveExecutions(): string[] { return Array.from(this.activeProcesses.keys()); }
  isRunning(executionId: string): boolean { return this.activeProcesses.has(executionId); }
  isUsingOpenClaw(): boolean { return this.useOpenClaw; }
}

export const executor = new ClaudeExecutor();
