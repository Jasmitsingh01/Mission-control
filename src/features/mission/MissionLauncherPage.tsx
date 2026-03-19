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
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
        // Use a predictable ID based on store behavior
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 mb-4">
          <Rocket className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-primary">Mission Launcher</span>
        </div>
        <h1 className="text-3xl font-bold text-foreground">
          {step === 'describe' && 'Describe Your Mission'}
          {step === 'planning' && 'Generating Your Team...'}
          {step === 'review' && 'Review Your Mission Plan'}
          {step === 'launching' && 'Launching Mission...'}
          {step === 'done' && 'Mission Launched!'}
        </h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-lg mx-auto">
          {step === 'describe' && 'Tell us what you want to build and we\'ll assemble the perfect AI agent team.'}
          {step === 'planning' && 'Analyzing your requirements and assembling the optimal agent team...'}
          {step === 'review' && 'Review the generated plan. You can launch it or go back to adjust.'}
          {step === 'launching' && 'Creating agents and assigning tasks...'}
          {step === 'done' && 'Your agents are deployed and tasks are assigned. They\'re ready to work!'}
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2">
        {(['describe', 'review', 'done'] as const).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={cn(
              'h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium border-2 transition-colors',
              step === s || (['review', 'launching', 'done'].includes(step) && i <= 1) || (step === 'done' && i <= 2)
                ? 'bg-primary border-primary text-primary-foreground'
                : 'border-border text-muted-foreground'
            )}>
              {step === 'done' && i <= 2 ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
            </div>
            {i < 2 && <div className={cn('w-16 h-0.5', step !== 'describe' && i === 0 ? 'bg-primary' : step === 'done' ? 'bg-primary' : 'bg-border')} />}
          </div>
        ))}
      </div>

      {/* STEP: Describe */}
      {step === 'describe' && (
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6 pb-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Mission Name</label>
                  <Input
                    placeholder="e.g., Crypto Trading Platform"
                    value={missionName}
                    onChange={(e) => setMissionName(e.target.value)}
                    className="text-base"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">
                    Describe what you want to build
                    <span className="text-muted-foreground font-normal ml-1">(be as detailed as possible)</span>
                  </label>
                  <textarea
                    placeholder="Describe your project, features, requirements, tech stack preferences, and any specific constraints..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={6}
                    className="flex w-full rounded-md border border-input bg-background px-4 py-3 text-sm leading-relaxed ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                  />
                  <p className="text-xs text-muted-foreground mt-1.5">
                    {description.length} characters — the more detail, the better the team and task breakdown
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Example prompts */}
          <div>
            <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Try an example:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {examplePrompts.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setDescription(prompt)
                    setMissionName(prompt.split(' ').slice(0, 4).join(' ').replace(/^(build|create|set up|design)\s+/i, ''))
                  }}
                  className="text-left rounded-lg border border-border p-3 text-xs text-muted-foreground hover:border-primary/30 hover:text-foreground transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* Error message */}
          {error && (
            <Card className="border-red-500/30 bg-red-500/5">
              <CardContent className="py-3">
                <p className="text-sm text-red-400">{error}</p>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end">
            <Button
              size="lg"
              disabled={!description.trim()}
              onClick={handleGenerate}
              className="gap-2"
            >
              <Sparkles className="h-4 w-4" />
              Generate Mission Plan
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP: Planning (loading) */}
      {step === 'planning' && (
        <Card>
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center">
              <div className="relative">
                <Loader2 className="h-12 w-12 text-primary animate-spin" />
                <Sparkles className="h-5 w-5 text-primary absolute -top-1 -right-1 animate-pulse" />
              </div>
              <p className="text-sm text-muted-foreground mt-4 animate-pulse">
                AI is analyzing your requirements...
              </p>
              <p className="text-xs text-muted-foreground/60 mt-2">
                Powered by OpenRouter
              </p>
              <div className="flex items-center gap-4 mt-6 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Bot className="h-3.5 w-3.5" /> Selecting agents</span>
                <span className="flex items-center gap-1"><ListTodo className="h-3.5 w-3.5" /> Breaking down tasks</span>
                <span className="flex items-center gap-1"><Sparkles className="h-3.5 w-3.5" /> Optimizing workflow</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP: Review */}
      {step === 'review' && plan && (
        <div className="space-y-4">
          <MissionReview plan={plan} />

          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => setStep('describe')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Edit
            </Button>
            <Button
              size="lg"
              onClick={handleLaunch}
              className="gap-2"
            >
              <Rocket className="h-4 w-4" />
              Launch Mission
            </Button>
          </div>
        </div>
      )}

      {/* STEP: Launching */}
      {step === 'launching' && (
        <Card>
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center">
              <Rocket className="h-12 w-12 text-primary animate-bounce" />
              <p className="text-lg font-medium mt-4">Deploying agents and tasks...</p>
              <div className="w-64 mt-6">
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{ width: `${launchProgress}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  {launchProgress}% complete
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP: Done */}
      {step === 'done' && plan && (
        <div className="space-y-4">
          <Card className="border-green-500/30 bg-green-500/5">
            <CardContent className="py-8">
              <div className="flex flex-col items-center justify-center">
                <CheckCircle2 className="h-14 w-14 text-green-400 mb-4" />
                <h2 className="text-xl font-bold">{plan.missionName}</h2>
                <p className="text-sm text-muted-foreground mt-1">{plan.summary}</p>
                <div className="flex items-center gap-3 mt-4">
                  <Badge className="bg-green-500/20 text-green-400 text-sm gap-1 py-1">
                    <Bot className="h-3.5 w-3.5" />
                    {plan.agents.length} agents deployed
                  </Badge>
                  <Badge className="bg-blue-500/20 text-blue-400 text-sm gap-1 py-1">
                    <ListTodo className="h-3.5 w-3.5" />
                    {plan.tasks.length} tasks assigned
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-center gap-3">
            <Button variant="outline" onClick={() => navigate('/agents')} className="gap-2">
              <Bot className="h-4 w-4" />
              View Agents
            </Button>
            <Button variant="outline" onClick={() => navigate('/board')} className="gap-2">
              <ListTodo className="h-4 w-4" />
              View Task Board
            </Button>
            <Button variant="outline" onClick={() => navigate('/activity')} className="gap-2">
              Activity Feed
            </Button>
            <Button
              onClick={() => {
                setStep('describe')
                setDescription('')
                setMissionName('')
                setPlan(null)
              }}
              className="gap-2"
            >
              <Rocket className="h-4 w-4" />
              Launch Another
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
