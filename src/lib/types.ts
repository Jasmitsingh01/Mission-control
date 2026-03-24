export type TaskStatus = "backlog" | "todo" | "inprogress" | "review" | "done";
export type TaskPriority = "critical" | "high" | "medium" | "low";

export const KANBAN_COLUMNS: {
  id: TaskStatus;
  title: string;
  color: string;
  bgColor: string;
  dotColor: string;
}[] = [
  { id: "backlog", title: "Backlog", color: "#64748b", bgColor: "#f1f5f9", dotColor: "#94a3b8" },
  { id: "todo", title: "To Do", color: "#6366f1", bgColor: "#e0e7ff", dotColor: "#818cf8" },
  { id: "inprogress", title: "In Progress", color: "#3b82f6", bgColor: "#dbeafe", dotColor: "#60a5fa" },
  { id: "review", title: "Review", color: "#f59e0b", bgColor: "#fef3c7", dotColor: "#fbbf24" },
  { id: "done", title: "Done", color: "#10b981", bgColor: "#d1fae5", dotColor: "#34d399" },
];

export const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string; bg: string }> = {
  critical: { label: "Critical", color: "#dc2626", bg: "#fef2f2" },
  high: { label: "High", color: "#f59e0b", bg: "#fffbeb" },
  medium: { label: "Medium", color: "#3b82f6", bg: "#eff6ff" },
  low: { label: "Low", color: "#10b981", bg: "#f0fdf4" },
};
