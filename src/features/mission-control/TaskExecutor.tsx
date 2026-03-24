import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ListTodo,
  Target,
} from "lucide-react";
import type { MCTask } from "@/stores/missionControlStore";
import type { ConnectionStatus } from "@/hooks/useOpenClaw";
import { PRIORITY_CONFIG } from "@/lib/types";
import type { TaskPriority } from "@/lib/types";

interface TaskExecutorProps {
  tasks: MCTask[];
  status: ConnectionStatus;
  onExecuteTask: (task: MCTask) => void;
}

export default function TaskExecutor({
  tasks,
  status,
  onExecuteTask,
}: TaskExecutorProps) {
  const [expanded, setExpanded] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const isConnected = status === "connected";

  const pendingTasks = tasks.filter(
    (t) => t.status === "todo" || t.status === "inprogress"
  );

  const handleExecute = useCallback(() => {
    if (!selectedId) return;
    const task = tasks.find((t) => t._id === selectedId);
    if (task) onExecuteTask(task);
  }, [selectedId, tasks, onExecuteTask]);

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full px-4 py-3 hover:bg-slate-800/30 transition-colors"
      >
        <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          Quick Execute
          {pendingTasks.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400">
              {pendingTasks.length}
            </span>
          )}
        </h3>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-slate-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-500" />
        )}
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-2">
              {pendingTasks.length === 0 ? (
                <div className="text-xs text-slate-600 text-center py-3 flex flex-col items-center gap-1">
                  <ListTodo className="w-5 h-5" />
                  No pending tasks to execute.
                </div>
              ) : (
                <>
                  {/* Task list */}
                  <div className="space-y-1 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                    {pendingTasks.map((task) => {
                      const priorityCfg =
                        PRIORITY_CONFIG[task.priority as TaskPriority];
                      const isSelected = selectedId === task._id;

                      return (
                        <motion.button
                          key={task._id}
                          onClick={() =>
                            setSelectedId(isSelected ? null : task._id)
                          }
                          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all text-xs ${
                            isSelected
                              ? "bg-indigo-500/15 border border-indigo-500/30"
                              : "bg-slate-800/40 border border-transparent hover:border-slate-700"
                          }`}
                          whileHover={{ x: 2 }}
                        >
                          <Target
                            className={`w-3 h-3 shrink-0 ${
                              isSelected
                                ? "text-indigo-400"
                                : "text-slate-500"
                            }`}
                          />
                          <span className="flex-1 truncate text-slate-300">
                            {task.title}
                          </span>
                          <span
                            className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium"
                            style={{
                              color: priorityCfg?.color || "#94a3b8",
                              backgroundColor: priorityCfg?.bg || "#1e293b",
                            }}
                          >
                            {task.priority}
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* Execute button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleExecute}
                    disabled={!selectedId || !isConnected}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <Play className="w-3.5 h-3.5" />
                    Execute Selected Task
                  </motion.button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
