import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Terminal as TerminalIcon,
  AlertCircle,
  User,
  Bot,
  Wrench,
  CheckCircle,
  Info,
  Loader2,
} from "lucide-react";
import type { TerminalEntry, LogLevel } from "@/hooks/useOpenClaw";

const LEVEL_CONFIG: Record<
  LogLevel,
  { color: string; bg: string; icon: React.ReactNode; label: string }
> = {
  system: {
    color: "text-slate-400",
    bg: "bg-slate-500/10",
    icon: <TerminalIcon className="w-3 h-3" />,
    label: "SYS",
  },
  user: {
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
    icon: <User className="w-3 h-3" />,
    label: "USR",
  },
  agent: {
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    icon: <Bot className="w-3 h-3" />,
    label: "AGT",
  },
  delta: {
    color: "text-emerald-300",
    bg: "bg-emerald-500/5",
    icon: <Bot className="w-3 h-3" />,
    label: "AGT",
  },
  error: {
    color: "text-red-400",
    bg: "bg-red-500/10",
    icon: <AlertCircle className="w-3 h-3" />,
    label: "ERR",
  },
  info: {
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    icon: <Info className="w-3 h-3" />,
    label: "INF",
  },
  success: {
    color: "text-green-400",
    bg: "bg-green-500/10",
    icon: <CheckCircle className="w-3 h-3" />,
    label: "OK",
  },
  tool_use: {
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    icon: <Wrench className="w-3 h-3" />,
    label: "TOOL",
  },
  tool_result: {
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    icon: <CheckCircle className="w-3 h-3" />,
    label: "RES",
  },
};

function formatTimestamp(ts: number) {
  const d = new Date(ts);
  return d.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

interface TerminalProps {
  logs: TerminalEntry[];
  isStreaming: boolean;
}

export default function Terminal({ logs, isStreaming }: TerminalProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="flex flex-col h-full bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/80 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <TerminalIcon className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-medium text-slate-300">Terminal</span>
          <span className="text-xs text-slate-500">
            {logs.length} {logs.length === 1 ? "entry" : "entries"}
          </span>
        </div>
        {isStreaming && (
          <motion.div
            className="flex items-center gap-1.5 text-xs text-emerald-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Streaming</span>
          </motion.div>
        )}
      </div>

      {/* Log area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-3 space-y-1 font-mono text-xs scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent"
      >
        {logs.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-2">
            <TerminalIcon className="w-8 h-8" />
            <p className="text-sm">Awaiting connection...</p>
          </div>
        )}

        <AnimatePresence initial={false}>
          {logs.map((entry) => {
            const config = LEVEL_CONFIG[entry.level];
            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className={`flex items-start gap-2 px-2 py-1.5 rounded ${config.bg}`}
              >
                <span className={`mt-0.5 ${config.color}`}>{config.icon}</span>
                <span className="text-slate-500 shrink-0 select-none">
                  {formatTimestamp(entry.timestamp)}
                </span>
                <span
                  className={`font-semibold shrink-0 uppercase text-[10px] mt-0.5 ${config.color}`}
                >
                  [{config.label}]
                </span>
                <span
                  className={`${config.color} break-all whitespace-pre-wrap flex-1`}
                >
                  {entry.content}
                  {entry.streaming && (
                    <motion.span
                      className="inline-block w-1.5 h-3.5 bg-emerald-400 ml-0.5 align-middle"
                      animate={{ opacity: [1, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity }}
                    />
                  )}
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
