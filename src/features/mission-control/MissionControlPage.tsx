import { useEffect, useCallback, useState } from "react";
import { motion } from "framer-motion";
import { RefreshCw, Trash2, Settings, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { useOpenClaw } from "@/hooks/useOpenClaw";
import {
  useMissionControlStore,
  type MCTask,
} from "@/stores/missionControlStore";
import { apiFetch } from "@/lib/api";
import Terminal from "./Terminal";
import CommandBar from "./CommandBar";
import SessionPanel from "./SessionPanel";
import AgentCards from "./AgentCards";
import MissionHeader from "./MissionHeader";
import TaskExecutor from "./TaskExecutor";

export default function MissionControlPage() {
  const {
    workspaces,
    setWorkspaces,
    activeWorkspace,
    setActiveWorkspace,
    tasks,
    setTasks,
    setGateways,
  } = useMissionControlStore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sessionKey = activeWorkspace?.openclawSession?.sessionKey;

  const {
    status,
    logs,
    isStreaming,
    pendingInteractions,
    connect,
    disconnect,
    sendMessage,
    clearLogs,
    pushLog,
    respondToGatewayInteraction,
  } = useOpenClaw(sessionKey);

  // Fetch workspaces
  const fetchWorkspaces = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiFetch("/workspaces");
      const ws = Array.isArray(data) ? data : data.workspaces || [];
      setWorkspaces(ws);

      // Auto-select first workspace if none active
      if (!activeWorkspace && ws.length > 0) {
        setActiveWorkspace(ws[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load workspaces");
    } finally {
      setLoading(false);
    }
  }, [setWorkspaces, activeWorkspace, setActiveWorkspace]);

  // Fetch tasks for active workspace
  const fetchTasks = useCallback(async () => {
    if (!activeWorkspace) return;
    try {
      const data = await apiFetch(`/workspaces/${activeWorkspace._id}/tasks`);
      const t = Array.isArray(data) ? data : data.tasks || [];
      setTasks(t);
    } catch {
      // Tasks may not be available yet
      setTasks([]);
    }
  }, [activeWorkspace, setTasks]);

  // Fetch gateways
  const fetchGateways = useCallback(async () => {
    try {
      const data = await apiFetch("/gateways");
      const g = Array.isArray(data) ? data : data.gateways || [];
      setGateways(g);
    } catch {
      setGateways([]);
    }
  }, [setGateways]);

  useEffect(() => {
    fetchWorkspaces();
    fetchGateways();
  }, [fetchWorkspaces, fetchGateways]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Handle task execution via the gateway
  const handleExecuteTask = useCallback(
    (task: MCTask) => {
      if (status !== "connected") {
        pushLog("error", "Connect to the gateway before executing tasks");
        return;
      }
      pushLog("system", `Executing task: ${task.title}`);
      sendMessage(
        `Execute the following task:\n\nTitle: ${task.title}\nDescription: ${task.desc || "No description"}\nPriority: ${task.priority}\nStatus: ${task.status}`
      );
    },
    [status, pushLog, sendMessage]
  );

  // Handle workspace switching
  const handleWorkspaceSwitch = useCallback(
    (wsId: string) => {
      const ws = workspaces.find((w) => w._id === wsId);
      if (ws) {
        if (status === "connected") {
          disconnect();
        }
        clearLogs();
        setActiveWorkspace(ws);
      }
    },
    [workspaces, status, disconnect, clearLogs, setActiveWorkspace]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <motion.div
          className="flex flex-col items-center gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
          <p className="text-sm text-slate-400">Loading Mission Control...</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="text-center space-y-3">
          <p className="text-red-400 text-sm">{error}</p>
          <button
            onClick={fetchWorkspaces}
            className="px-4 py-2 text-xs bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <MissionHeader
        workspaceName={activeWorkspace?.name || ""}
        status={status}
        isStreaming={isStreaming}
        taskCount={tasks.length}
        agentCount={activeWorkspace?.agents?.length || 0}
        pendingInteractionCount={pendingInteractions.length}
      />

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar */}
        <motion.aside
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="w-80 border-r border-slate-800 bg-slate-900/40 overflow-y-auto p-4 space-y-4 hidden lg:block"
        >
          {/* Workspace selector */}
          {workspaces.length > 1 && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Workspace
              </label>
              <select
                value={activeWorkspace?._id || ""}
                onChange={(e) => handleWorkspaceSwitch(e.target.value)}
                className="w-full bg-slate-800 text-slate-300 text-xs px-3 py-2 rounded-lg border border-slate-700 focus:border-indigo-500/50 outline-none"
              >
                {workspaces.map((ws) => (
                  <option key={ws._id} value={ws._id}>
                    {ws.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Session panel */}
          <SessionPanel
            workspace={activeWorkspace}
            status={status}
            sessionKey={sessionKey}
            onConnect={connect}
            onDisconnect={disconnect}
          />

          {/* Agent cards */}
          <AgentCards agents={activeWorkspace?.agents || []} />

          {/* Task executor */}
          <TaskExecutor
            tasks={tasks}
            status={status}
            onExecuteTask={handleExecuteTask}
          />

          {/* Quick links */}
          <div className="space-y-1">
            <Link
              to={`/kanban`}
              className="flex items-center gap-2 px-3 py-2 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded-lg transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              Open Kanban Board
            </Link>
            <Link
              to={`/settings`}
              className="flex items-center gap-2 px-3 py-2 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded-lg transition-colors"
            >
              <Settings className="w-3 h-3" />
              Workspace Settings
            </Link>
          </div>
        </motion.aside>

        {/* Center: Terminal + Command bar */}
        <div className="flex-1 flex flex-col p-4 gap-3 min-w-0">
          {/* Toolbar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">
                {logs.length} log entries
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={clearLogs}
                className="flex items-center gap-1 px-2 py-1 text-[10px] text-slate-500 hover:text-slate-300 bg-slate-800/50 rounded-md transition-colors"
                title="Clear terminal"
              >
                <Trash2 className="w-3 h-3" />
                Clear
              </button>
              <button
                onClick={() => {
                  fetchTasks();
                  fetchGateways();
                }}
                className="flex items-center gap-1 px-2 py-1 text-[10px] text-slate-500 hover:text-slate-300 bg-slate-800/50 rounded-md transition-colors"
                title="Refresh data"
              >
                <RefreshCw className="w-3 h-3" />
                Refresh
              </button>
            </div>
          </div>

          {/* Pending interaction requests */}
          {pendingInteractions.length > 0 && (
            <div className="space-y-2">
              {pendingInteractions.map((req) => (
                <div
                  key={req.requestId}
                  className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 space-y-2"
                >
                  <div className="flex items-start gap-2">
                    <span className="text-amber-400 text-sm font-semibold">{req.title}</span>
                  </div>
                  {req.description && (
                    <p className="text-xs text-amber-300/70">{req.description}</p>
                  )}
                  {req.type === "approval" ? (
                    <div className="flex items-center gap-2">
                      {(req.options || ["Approve", "Reject"]).map((opt) => (
                        <button
                          key={opt}
                          onClick={() => respondToGatewayInteraction(req.requestId, { action: opt })}
                          className="px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 transition-colors"
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Type response..."
                        className="flex-1 bg-slate-800 text-slate-300 text-xs px-3 py-1.5 rounded-lg border border-slate-700 focus:border-amber-500/50 outline-none"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            respondToGatewayInteraction(req.requestId, { text: (e.target as HTMLInputElement).value });
                            (e.target as HTMLInputElement).value = "";
                          }
                        }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Terminal */}
          <div className="flex-1 min-h-0">
            <Terminal logs={logs} isStreaming={isStreaming} />
          </div>

          {/* Command bar */}
          <CommandBar
            status={status}
            isStreaming={isStreaming}
            onSend={sendMessage}
          />
        </div>
      </div>
    </div>
  );
}
