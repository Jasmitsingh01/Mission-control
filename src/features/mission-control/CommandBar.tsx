import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Send,
  Wifi,
  WifiOff,
  Loader2,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import type { ConnectionStatus } from "@/hooks/useOpenClaw";

const STATUS_CONFIG: Record<
  ConnectionStatus,
  { color: string; bg: string; label: string; icon: React.ReactNode }
> = {
  connected: {
    color: "text-emerald-400",
    bg: "bg-emerald-500/20",
    label: "Connected",
    icon: <Wifi className="w-3 h-3" />,
  },
  connecting: {
    color: "text-amber-400",
    bg: "bg-amber-500/20",
    label: "Connecting",
    icon: <Loader2 className="w-3 h-3 animate-spin" />,
  },
  disconnected: {
    color: "text-slate-500",
    bg: "bg-slate-500/20",
    label: "Disconnected",
    icon: <WifiOff className="w-3 h-3" />,
  },
  error: {
    color: "text-red-400",
    bg: "bg-red-500/20",
    label: "Error",
    icon: <WifiOff className="w-3 h-3" />,
  },
};

interface CommandBarProps {
  status: ConnectionStatus;
  isStreaming: boolean;
  onSend: (message: string) => void;
}

export default function CommandBar({
  status,
  isStreaming,
  onSend,
}: CommandBarProps) {
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  const statusCfg = STATUS_CONFIG[status];

  const handleSubmit = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setHistory((prev) => [trimmed, ...prev].slice(0, 50));
    setHistoryIdx(-1);
    setInput("");
  }, [input, onSend]);

  const navigateHistory = useCallback(
    (direction: "up" | "down") => {
      if (history.length === 0) return;
      let next: number;
      if (direction === "up") {
        next = Math.min(historyIdx + 1, history.length - 1);
      } else {
        next = Math.max(historyIdx - 1, -1);
      }
      setHistoryIdx(next);
      setInput(next >= 0 ? history[next] : "");
    },
    [history, historyIdx]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      navigateHistory("up");
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      navigateHistory("down");
    }
  };

  const disabled = status !== "connected" || isStreaming;

  return (
    <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl">
      {/* Status indicator */}
      <motion.div
        className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium ${statusCfg.color} ${statusCfg.bg}`}
        initial={false}
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 0.3 }}
        key={status}
      >
        {statusCfg.icon}
        <span className="hidden sm:inline">{statusCfg.label}</span>
      </motion.div>

      {/* Input */}
      <div className="flex-1 relative">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            disabled
              ? status === "connected"
                ? "Agent is responding..."
                : "Connect to send messages..."
              : "Type a command or message..."
          }
          disabled={disabled}
          className="w-full bg-slate-800/50 text-slate-200 text-sm px-3 py-2 rounded-lg border border-slate-700 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 outline-none placeholder:text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        />
      </div>

      {/* History nav */}
      {history.length > 0 && (
        <div className="flex flex-col gap-0.5">
          <button
            onClick={() => navigateHistory("up")}
            className="text-slate-600 hover:text-slate-400 transition-colors"
            aria-label="Previous command"
          >
            <ChevronUp className="w-3 h-3" />
          </button>
          <button
            onClick={() => navigateHistory("down")}
            className="text-slate-600 hover:text-slate-400 transition-colors"
            aria-label="Next command"
          >
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Send button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleSubmit}
        disabled={disabled || !input.trim()}
        className="p-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        aria-label="Send message"
      >
        {isStreaming ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Send className="w-4 h-4" />
        )}
      </motion.button>
    </div>
  );
}
