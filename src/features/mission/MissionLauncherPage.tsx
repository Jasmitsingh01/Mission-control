import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Rocket,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Bot,
  ListTodo,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTaskStore } from '@/stores/taskStore'
import { useAgentStore } from '@/stores/agentStore'
import { useActivityStore } from '@/stores/activityStore'
import { generateMissionPlan, type MissionPlan } from './missionPlanner'
import { MissionReview } from './MissionReview'

type Step = 'describe' | 'planning' | 'review' | 'launching' | 'done'

const examplePrompts = [
  'Build a real-time crypto trading bot with price alerts, P2P order monitoring, and multi-exchange support',
  'Create a SaaS landing page with authentication, dashboard, billing integration, and admin panel',
  'Set up a data pipeline that scrapes product prices from 5 e-commerce sites daily and generates reports',
  'Build a REST API for a task management app with user auth, teams, and real-time notifications',
  'Design and implement a mobile-responsive portfolio website with blog, contact form, and SEO optimization',
  'Create an automated testing framework for our microservices with CI/CD integration and coverage reports',
]

export function MissionLauncherPage() {
  const navigate = useNavigate()
  const addTask = useTaskStore((s) => s.addTask)
  const addAgent = useAgentStore((s) => s.addAgent)
  const addEvent = useActivityStore((s) => s.addEvent)

  const [step, setStep] = useState<Step>('describe')
  const [missionName, setMissionName] = useState('')
  const [description, setDescription] = useState('')
  const [plan, setPlan] = useState<MissionPlan | null>(null)
  const [launchProgress, setLaunchProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = useCallback(async () => {
    if (!description.trim()) return
    const name = missionName.trim() || 'New Mission'

    setStep('planning')
    setError(null)

    try {
      const generatedPlan = await generateMissionPlan(description.trim(), name)
      setPlan(generatedPlan)
      setStep('review')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate plan. Please try again.')
      setStep('describe')
    }
  }, [description, missionName])

  const handleLaunch = useCallback(() => {
    if (!plan) return
    setStep('launching')
    setLaunchProgress(0)

    // Animate launch: create agents first, then tasks
    const totalSteps = plan.agents.length + plan.tasks.length
    let currentStep = 0

    // Create agents one by one
    const createNext = () => {
      if (currentStep < plan.agents.length) {
        const agentData = plan.agents[currentStep]
        addAgent({
          name: agentData.name,
          description: agentData.description,
          status: 'running',
          provider: agentData.provider,
          model: agentData.model,
          config: {
            temperature: agentData.temperature,
            maxTokens: agentData.maxTokens,
            systemPrompt: agentData.systemPrompt,
          },
          enabledSkills: agentData.skills,
          lastActiveAt: Date.now(),
          errorMessage: null,
          tasksAssigned: plan.tasks.filter((t) => t.assignedAgentRole === agentData.role).length,
        })

        addEvent({
          type: 'agent_spawned',
          severity: 'success',
          message: `${agentData.name} spawned for mission "${plan.missionName}"`,
          actorType: 'system',
          metadata: { mission: plan.missionName, role: agentData.role },
        })

        currentStep++
        setLaunchProgress(Math.round((currentStep / totalSteps) * 100))
        setTimeout(createNext, 300)
      } else if (currentStep < totalSteps) {
        // Create tasks
        const taskIdx = currentStep - plan.agents.length
        const taskData = plan.tasks[taskIdx]

        addTask({
          title: taskData.title,
          description: taskData.description,
          status: taskData.status,
          priority: taskData.priority,
          assignedAgentId: null,
          labels: [...taskData.labels, 'mission:' + plan.missionName.toLowerCase().replace(/\s+/g, '-')],
          dueDate: null,
        })

        addEvent({
          type: 'task_created',
          severity: 'info',
          message: `Task "${taskData.title}" created and assigned to ${plan.agents.find((a) => a.role === taskData.assignedAgentRole)?.name ?? 'system'}`,
          actorType: 'system',
          metadata: { mission: plan.missionName },
        })

        currentStep++
        setLaunchProgress(Math.round((currentStep / totalSteps) * 100))
        setTimeout(createNext, 200)
      } else {
        // Done
        addEvent({
          type: 'system',
          severity: 'success',
          message: `Mission "${plan.missionName}" launched: ${plan.agents.length} agents deployed, ${plan.tasks.length} tasks created`,
          actorType: 'system',
          metadata: { mission: plan.missionName },
        })
        setStep('done')
      }
    }

    setTimeout(createNext, 500)
  }, [plan, addAgent, addTask, addEvent])

  const stepIndex = step === 'describe' ? 0 : step === 'planning' ? 0 : step === 'review' ? 1 : step === 'launching' ? 2 : 2

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center pt-4">
        <span className="font-mono text-primary text-xs tracking-widest uppercase">Workflow Architect</span>
        <h1 className="text-4xl font-black text-on-surface mt-2">
          {step === 'describe' && 'Construct New Team'}
          {step === 'planning' && 'Generating Your Team...'}
          {step === 'review' && 'Review Your Mission Plan'}
          {step === 'launching' && 'Launching Mission...'}
          {step === 'done' && 'Mission Launched!'}
        </h1>
        <p className="text-sm text-on-surface-variant mt-3 max-w-lg mx-auto">
          {step === 'describe' && 'Tell us what you want to build and we\'ll assemble the perfect AI agent team.'}
          {step === 'planning' && 'Analyzing your requirements and assembling the optimal agent team...'}
          {step === 'review' && 'Review the generated plan. You can launch it or go back to adjust.'}
          {step === 'launching' && 'Creating agents and assigning tasks...'}
          {step === 'done' && 'Your agents are deployed and tasks are assigned. They\'re ready to work!'}
        </p>
      </div>

      {/* Step indicator circles */}
      <div className="flex items-center justify-center gap-3">
        {[1, 2, 3].map((num, i) => (
          <div key={num} className="flex items-center gap-3">
            <div className={cn(
              "h-10 w-10 rounded-full flex items-center justify-center font-mono text-sm font-bold border-2 transition-all",
              i <= stepIndex
                ? 'synthetic-gradient border-transparent text-white shadow-[0_0_20px_rgba(103,80,164,0.3)]'
                : 'border-outline-variant/30 text-outline bg-surface-container'
            )}>
              {step === 'done' || (i < stepIndex) ? <CheckCircle2 className="h-5 w-5" /> : num}
            </div>
            {i < 2 && (
              <div className={cn(
                'w-20 h-0.5 rounded-full transition-all',
                i < stepIndex ? 'synthetic-gradient' : 'bg-outline-variant/20'
              )} />
            )}
          </div>
        ))}
      </div>

      {/* STEP: Describe */}
      {step === 'describe' && (
        <div className="space-y-6">
          <div className="bg-surface-container-low rounded-xl border border-outline-variant/10 p-6">
            <div className="space-y-5">
              <div>
                <label className="font-mono text-[10px] font-bold uppercase tracking-widest text-outline mb-2 block">Mission Name</label>
                <input
                  type="text"
                  placeholder="e.g., Crypto Trading Platform"
                  value={missionName}
                  onChange={(e) => setMissionName(e.target.value)}
                  className="w-full rounded-lg border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 text-base text-on-surface placeholder:text-outline focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
                />
              </div>
              <div>
                <label className="font-mono text-[10px] font-bold uppercase tracking-widest text-outline mb-2 block">
                  Describe what you want to build
                  <span className="text-on-surface-variant font-normal normal-case tracking-normal text-[11px] ml-2">(be as detailed as possible)</span>
                </label>
                <div className="relative group">
                  <textarea
                    placeholder="Describe your project, features, requirements, tech stack preferences, and any specific constraints..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={6}
                    className="w-full rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 text-sm leading-relaxed text-on-surface placeholder:text-outline focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 focus:shadow-[0_0_30px_rgba(103,80,164,0.1)] resize-none transition-all"
                  />
                </div>
                <p className="font-mono text-[10px] text-outline mt-2">
                  {description.length} characters — the more detail, the better the team and task breakdown
                </p>
              </div>
            </div>
          </div>

          {/* Quick prompt pills */}
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-outline mb-3 flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-primary" />
              Quick prompts
            </p>
            <div className="flex flex-wrap gap-2">
              {examplePrompts.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setDescription(prompt)
                    setMissionName(prompt.split(' ').slice(0, 4).join(' ').replace(/^(build|create|set up|design)\s+/i, ''))
                  }}
                  className="rounded-full border border-outline-variant/20 px-4 py-2 text-[11px] text-on-surface-variant hover:border-primary/30 hover:text-primary hover:bg-primary/5 transition-all"
                >
                  {prompt.length > 60 ? prompt.slice(0, 60) + '...' : prompt}
                </button>
              ))}
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-error-container/10 border border-error/30 rounded-xl p-4">
              <p className="text-sm text-error">{error}</p>
            </div>
          )}

          {/* Bottom action bar */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => {
                setDescription('')
                setMissionName('')
              }}
              className="font-mono uppercase tracking-widest text-[10px] font-bold px-4 py-2.5 rounded-lg text-outline hover:text-on-surface-variant transition-colors"
            >
              Discard Draft
            </button>
            <div className="flex items-center gap-3">
              <button
                disabled={!description.trim()}
                className="font-mono uppercase tracking-widest text-[10px] font-bold px-4 py-2.5 rounded-lg border border-outline-variant/20 text-on-surface-variant hover:bg-surface-container-high transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Preview Plan
              </button>
              <button
                disabled={!description.trim()}
                onClick={handleGenerate}
                className="synthetic-gradient text-white font-mono uppercase tracking-widest text-[10px] font-bold px-6 py-2.5 rounded-lg flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(103,80,164,0.2)]"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Launch Team
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP: Planning (loading) */}
      {step === 'planning' && (
        <div className="bg-surface-container-low rounded-xl border border-outline-variant/10 p-16">
          <div className="flex flex-col items-center justify-center">
            <div className="relative">
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
              <Sparkles className="h-5 w-5 text-secondary absolute -top-1 -right-1 animate-pulse" />
            </div>
            <p className="text-sm text-on-surface-variant mt-4 animate-pulse">
              AI is analyzing your requirements...
            </p>
            <p className="font-mono text-[10px] text-outline mt-2">
              Powered by OpenRouter
            </p>
            <div className="flex items-center gap-6 mt-6">
              <span className="flex items-center gap-1.5 font-mono text-[10px] text-on-surface-variant">
                <Bot className="h-3.5 w-3.5 text-secondary" /> Selecting agents
              </span>
              <span className="flex items-center gap-1.5 font-mono text-[10px] text-on-surface-variant">
                <ListTodo className="h-3.5 w-3.5 text-primary" /> Breaking down tasks
              </span>
              <span className="flex items-center gap-1.5 font-mono text-[10px] text-on-surface-variant">
                <Sparkles className="h-3.5 w-3.5 text-tertiary" /> Optimizing workflow
              </span>
            </div>
          </div>
        </div>
      )}

      {/* STEP: Review */}
      {step === 'review' && plan && (
        <div className="space-y-6">
          <MissionReview plan={plan} />

          <div className="flex items-center justify-between">
            <button
              onClick={() => setStep('describe')}
              className="font-mono uppercase tracking-widest text-[10px] font-bold px-4 py-2.5 rounded-lg border border-outline-variant/20 text-on-surface-variant hover:bg-surface-container-high transition-all flex items-center gap-2"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Edit
            </button>
            <button
              onClick={handleLaunch}
              className="synthetic-gradient text-white font-mono uppercase tracking-widest text-[10px] font-bold px-6 py-2.5 rounded-lg flex items-center gap-2 hover:opacity-90 transition-opacity shadow-[0_0_20px_rgba(103,80,164,0.2)]"
            >
              <Rocket className="h-3.5 w-3.5" />
              Launch Mission
            </button>
          </div>
        </div>
      )}

      {/* STEP: Launching */}
      {step === 'launching' && (
        <div className="bg-surface-container-low rounded-xl border border-outline-variant/10 p-16">
          <div className="flex flex-col items-center justify-center">
            <Rocket className="h-12 w-12 text-primary animate-bounce" />
            <p className="text-lg font-semibold text-on-surface mt-4">Deploying agents and tasks...</p>
            <div className="w-64 mt-6">
              <div className="h-1.5 rounded-full bg-surface-container-lowest overflow-hidden">
                <div
                  className="h-full synthetic-gradient rounded-full transition-all duration-300"
                  style={{ width: `${launchProgress}%` }}
                />
              </div>
              <p className="font-mono text-[10px] text-outline text-center mt-2">
                {launchProgress}% complete
              </p>
            </div>
          </div>
        </div>
      )}

      {/* STEP: Done */}
      {step === 'done' && plan && (
        <div className="space-y-6">
          <div className="bg-surface-container-low rounded-xl border border-green-500/20 p-8">
            <div className="flex flex-col items-center justify-center">
              <CheckCircle2 className="h-14 w-14 text-green-400 mb-4" />
              <h2 className="text-xl font-bold text-on-surface">{plan.missionName}</h2>
              <p className="text-sm text-on-surface-variant mt-1">{plan.summary}</p>
              <div className="flex items-center gap-3 mt-4">
                <span className="font-mono text-[10px] font-bold uppercase bg-green-500/10 text-green-400 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                  <Bot className="h-3.5 w-3.5" />
                  {plan.agents.length} agents deployed
                </span>
                <span className="font-mono text-[10px] font-bold uppercase bg-secondary/10 text-secondary px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                  <ListTodo className="h-3.5 w-3.5" />
                  {plan.tasks.length} tasks assigned
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => navigate('/dashboard/agents')}
              className="font-mono uppercase tracking-widest text-[10px] font-bold px-4 py-2.5 rounded-lg border border-outline-variant/20 text-on-surface-variant hover:bg-surface-container-high transition-all flex items-center gap-2"
            >
              <Bot className="h-3.5 w-3.5" />
              View Agents
            </button>
            <button
              onClick={() => navigate('/dashboard/board')}
              className="font-mono uppercase tracking-widest text-[10px] font-bold px-4 py-2.5 rounded-lg border border-outline-variant/20 text-on-surface-variant hover:bg-surface-container-high transition-all flex items-center gap-2"
            >
              <ListTodo className="h-3.5 w-3.5" />
              View Task Board
            </button>
            <button
              onClick={() => navigate('/dashboard/activity')}
              className="font-mono uppercase tracking-widest text-[10px] font-bold px-4 py-2.5 rounded-lg border border-outline-variant/20 text-on-surface-variant hover:bg-surface-container-high transition-all"
            >
              Activity Feed
            </button>
            <button
              onClick={() => {
                setStep('describe')
                setDescription('')
                setMissionName('')
                setPlan(null)
              }}
              className="synthetic-gradient text-white font-mono uppercase tracking-widest text-[10px] font-bold px-5 py-2.5 rounded-lg flex items-center gap-2 hover:opacity-90 transition-opacity"
            >
              <Rocket className="h-3.5 w-3.5" />
              Launch Another
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
