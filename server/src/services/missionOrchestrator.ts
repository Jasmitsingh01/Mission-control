import { EventEmitter } from 'events';
import Execution from '../models/Execution';
import MissionHistory from '../models/MissionHistory';
import { openclawStream, openclawHealthCheck } from './openclawClient';
import type { OpenClawMessage } from './openclawClient';
import { notifyMissionComplete } from './notifier';

/**
 * Maps agent skills to OpenClaw tool names.
 * When an agent has a skill, it tells OpenClaw to use those tools.
 */
const SKILL_TO_TOOLS: Record<string, string[]> = {
  'web-search': ['web_search', 'web_fetch'],
  'code-analysis': ['read', 'glob', 'grep'],
  'git-operations': ['shell (git *)'],
  'test-runner': ['shell (npm test *)', 'shell (npx jest *)'],
  'doc-generator': ['write', 'read'],
  'database-query': ['shell (mongo *)', 'shell (psql *)'],
  'csv-json-parser': ['read', 'write', 'shell (jq *)'],
  'slack-integration': ['slack'],
  'email-sender': ['shell (mail *)'],
  'image-analysis': ['read'],
  'cron-scheduler': ['shell (crontab *)'],
  'api-client': ['shell (curl *)', 'web_fetch'],
};

export interface AgentPlan {
  name: string;
  description: string;
  role: string;
  provider: string;
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  skills: string[];
}

export interface TaskPlan {
  title: string;
  description: string;
  priority: string;
  status: string;
  labels: string[];
  assignedAgentRole: string;
  order: number;
}

export interface MissionPlan {
  missionName: string;
  summary: string;
  agents: AgentPlan[];
  tasks: TaskPlan[];
  estimatedPhases: string[];
}

export interface MissionLaunchRequest {
  userId: string;
  orgId: string;
  plan: MissionPlan;
}

export interface AgentExecution {
  agentName: string;
  agentRole: string;
  executionId: string;
  tasks: TaskPlan[];
  status: 'queued' | 'running' | 'completed' | 'failed';
}

export interface MissionStatus {
  missionId: string;
  missionName: string;
  userId: string;
  status: 'running' | 'completed' | 'partial' | 'failed';
  agentExecutions: AgentExecution[];
  completedCount: number;
  totalCount: number;
  startedAt: number;
}

export interface MissionStreamEvent {
  missionId: string;
  agentRole: string;
  agentName: string;
  executionId: string;
  type: 'text' | 'tool_use' | 'tool_result' | 'error' | 'status' | 'agent_complete' | 'mission_complete';
  content: string;
  timestamp: number;
}

class MissionOrchestrator extends EventEmitter {
  private activeMissions: Map<string, MissionStatus> = new Map();

  /**
   * Launch a full mission — creates per-agent executions and runs them.
   * Agents execute in priority order: critical tasks first, then high, then medium/low.
   */
  async launch(req: MissionLaunchRequest): Promise<MissionStatus> {
    const available = await openclawHealthCheck();
    if (!available) {
      throw new Error('OpenClaw gateway is not reachable. Start it with: openclaw gateway start');
    }

    const missionId = `mission_${Date.now()}`;

    // Group tasks by agent role
    const tasksByAgent = new Map<string, TaskPlan[]>();
    for (const task of req.plan.tasks) {
      const existing = tasksByAgent.get(task.assignedAgentRole) || [];
      existing.push(task);
      tasksByAgent.set(task.assignedAgentRole, existing);
    }

    // Sort tasks within each agent by priority (critical > high > medium > low) then order
    const priorityWeight: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    for (const [, tasks] of tasksByAgent) {
      tasks.sort((a, b) => {
        const pw = (priorityWeight[a.priority] ?? 2) - (priorityWeight[b.priority] ?? 2);
        return pw !== 0 ? pw : a.order - b.order;
      });
    }

    // Create one execution per agent
    const agentExecutions: AgentExecution[] = [];

    for (const agent of req.plan.agents) {
      const agentTasks = tasksByAgent.get(agent.role) || [];
      if (agentTasks.length === 0) continue;

      // Build agent-specific prompt with its assigned tasks
      const taskList = agentTasks.map((t, i) =>
        `${i + 1}. [${t.priority.toUpperCase()}] ${t.title}\n   ${t.description}`
      ).join('\n\n');

      const prompt = `## Your Role: ${agent.name}
${agent.description}

## Mission: ${req.plan.missionName}
${req.plan.summary}

## Your Assigned Tasks (execute in order):

${taskList}

## Instructions:
- Complete each task thoroughly before moving to the next
- Report what you did for each task
- If a task fails, report the error and continue to the next task
- Use the appropriate tools for each task (read files, write code, run commands, etc.)`;

      // Build system prompt with agent persona + skills context
      const skillsList = agent.skills.length > 0
        ? `\nYour specialized skills: ${agent.skills.join(', ')}`
        : '';

      const systemPrompt = `${agent.systemPrompt}${skillsList}

You are ${agent.name}, part of a team executing the mission "${req.plan.missionName}".
You have ${agentTasks.length} task(s) assigned to you. Execute them one by one, in order.
Be thorough, precise, and report your progress for each task.`;

      // Create execution record in MongoDB
      const execution = new Execution({
        userId: req.userId,
        orgId: req.orgId,
        taskTitle: `[${agent.name}] ${req.plan.missionName}`,
        prompt,
        claudeModel: agent.model || 'claude-sonnet-4-6',
        allowedTools: this.resolveTools(agent.skills),
        status: 'queued',
      });
      await execution.save();

      agentExecutions.push({
        agentName: agent.name,
        agentRole: agent.role,
        executionId: execution._id.toString(),
        tasks: agentTasks,
        status: 'queued',
      });
    }

    const missionStatus: MissionStatus = {
      missionId,
      missionName: req.plan.missionName,
      userId: req.userId,
      status: 'running',
      agentExecutions,
      completedCount: 0,
      totalCount: agentExecutions.length,
      startedAt: Date.now(),
    };

    this.activeMissions.set(missionId, missionStatus);

    // Launch all agent executions in parallel
    for (const agentExec of agentExecutions) {
      const agent = req.plan.agents.find((a) => a.role === agentExec.agentRole)!;
      this.executeAgent(missionId, agentExec, agent).catch((err) => {
        console.error(`[Mission] Agent ${agentExec.agentName} failed:`, err.message);
      });
    }

    // Save mission history
    const missionHistory = new MissionHistory({
      userId: req.userId,
      missionName: req.plan.missionName,
      description: req.plan.summary,
      summary: req.plan.summary,
      agents: req.plan.agents.map((a) => ({
        name: a.name,
        role: a.role,
        provider: a.provider,
        model: a.model,
      })),
      tasks: req.plan.tasks.map((t) => ({
        title: t.title,
        description: t.description,
        priority: t.priority,
        status: t.status,
        assignedAgentRole: t.assignedAgentRole,
      })),
      estimatedPhases: req.plan.estimatedPhases,
      status: 'completed', // Will be updated later
    });
    await missionHistory.save();

    return missionStatus;
  }

  /**
   * Execute a single agent's tasks via OpenClaw
   */
  private async executeAgent(
    missionId: string,
    agentExec: AgentExecution,
    agent: AgentPlan
  ): Promise<void> {
    const execution = await Execution.findById(agentExec.executionId);
    if (!execution) return;

    execution.status = 'running';
    execution.startedAt = new Date();
    await execution.save();

    agentExec.status = 'running';

    this.emitMissionEvent(missionId, agentExec, 'status', `${agent.name} started working...`);

    const startTime = Date.now();

    try {
      const messages: OpenClawMessage[] = [
        { role: 'system', content: execution.prompt.split('## Your Assigned Tasks')[0] }, // System prompt part
        { role: 'user', content: execution.prompt },
      ];

      let fullResult = '';

      for await (const chunk of openclawStream({ messages, maxTokens: agent.maxTokens || 4096 })) {
        if (chunk.type === 'delta') {
          fullResult += chunk.content;
          this.emitMissionEvent(missionId, agentExec, 'text', chunk.content);
          execution.logs.push({ timestamp: new Date(), type: 'text', content: chunk.content });
        } else if (chunk.type === 'error') {
          throw new Error(chunk.content);
        }
      }

      execution.status = 'completed';
      execution.result = fullResult || '(no output)';
      execution.completedAt = new Date();
      execution.usage.durationMs = Date.now() - startTime;
      await execution.save();

      agentExec.status = 'completed';
      this.emitMissionEvent(missionId, agentExec, 'agent_complete', fullResult.slice(0, 500));

    } catch (err: any) {
      execution.status = 'failed';
      execution.error = err.message;
      execution.completedAt = new Date();
      execution.usage.durationMs = Date.now() - startTime;
      await execution.save();

      agentExec.status = 'failed';
      this.emitMissionEvent(missionId, agentExec, 'error', err.message);
    }

    // Check if all agents are done
    this.checkMissionCompletion(missionId);
  }

  /**
   * Check if all agents in a mission have completed
   */
  private checkMissionCompletion(missionId: string): void {
    const mission = this.activeMissions.get(missionId);
    if (!mission) return;

    const completed = mission.agentExecutions.filter((a) => a.status === 'completed').length;
    const failed = mission.agentExecutions.filter((a) => a.status === 'failed').length;
    const total = mission.agentExecutions.length;

    mission.completedCount = completed + failed;

    if (completed + failed === total) {
      if (failed === 0) {
        mission.status = 'completed';
      } else if (completed > 0) {
        mission.status = 'partial';
      } else {
        mission.status = 'failed';
      }

      const totalDurationMs = Date.now() - mission.startedAt;

      // Emit mission_complete event (triggers beep on frontend)
      this.emit('mission_stream', {
        missionId,
        agentRole: 'system',
        agentName: 'Mission Control',
        executionId: '',
        type: 'mission_complete',
        content: `Mission "${mission.missionName}" ${mission.status}: ${completed}/${total} agents completed`,
        timestamp: Date.now(),
      } as MissionStreamEvent);

      // Send email notification
      const agentResults = mission.agentExecutions.map((ae) => ({
        name: ae.agentName,
        status: ae.status,
        result: ae.status === 'completed' ? '(see dashboard)' : 'Failed',
      }));

      // Fetch actual results from DB for the email
      Promise.all(
        mission.agentExecutions.map(async (ae) => {
          const exec = await Execution.findById(ae.executionId).lean();
          return {
            name: ae.agentName,
            status: ae.status,
            result: exec?.result || exec?.error || '(no output)',
          };
        })
      ).then((results) => {
        notifyMissionComplete({
          userId: mission.userId,
          missionName: mission.missionName,
          status: mission.status as 'completed' | 'partial' | 'failed',
          agentResults: results,
          totalDurationMs,
        });
      }).catch((err) => {
        console.error('[Mission] Failed to send notification:', err.message);
      });

      // Cleanup after 5 minutes
      setTimeout(() => this.activeMissions.delete(missionId), 5 * 60 * 1000);
    }
  }

  /**
   * Resolve agent skills to OpenClaw tool names
   */
  private resolveTools(skills: string[]): string[] {
    const baseTools = ['Read', 'Edit', 'Write', 'Bash', 'Glob', 'Grep'];
    const skillTools = new Set(baseTools);

    for (const skill of skills) {
      const tools = SKILL_TO_TOOLS[skill];
      if (tools) {
        tools.forEach((t) => skillTools.add(t));
      }
    }

    return Array.from(skillTools);
  }

  /**
   * Emit a mission-level stream event
   */
  private emitMissionEvent(
    missionId: string,
    agentExec: AgentExecution,
    type: MissionStreamEvent['type'],
    content: string
  ): void {
    // Emit for mission-level subscribers
    this.emit('mission_stream', {
      missionId,
      agentRole: agentExec.agentRole,
      agentName: agentExec.agentName,
      executionId: agentExec.executionId,
      type,
      content,
      timestamp: Date.now(),
    } as MissionStreamEvent);

    // Also emit as regular execution stream for ExecutionPanel compatibility
    const { executor } = require('./claudeExecutor');
    executor.emit('stream', {
      executionId: agentExec.executionId,
      type: type === 'agent_complete' ? 'complete' : type === 'mission_complete' ? 'status' : type,
      content,
      timestamp: Date.now(),
    });
  }

  getMissionStatus(missionId: string): MissionStatus | undefined {
    return this.activeMissions.get(missionId);
  }

  getActiveMissions(): MissionStatus[] {
    return Array.from(this.activeMissions.values());
  }
}

export const orchestrator = new MissionOrchestrator();
