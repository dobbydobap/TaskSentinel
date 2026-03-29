"use client";

import Link from "next/link";

import type { Task, TaskStatus } from "@/lib/types";

import StatusBadge from "./StatusBadge";
import styles from "./TaskCard.module.css";

interface TaskCardProps {
  task: Task;
  onStatusChange?: (taskId: string, status: TaskStatus) => void;
}

const PRIORITY_LABELS: Record<string, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
};

function formatDeadline(deadline: string | null): string {
  if (!deadline) return "No deadline";
  const d = new Date(deadline);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMs < 0) return "Overdue";
  if (diffHours < 24) return `${diffHours}h left`;
  if (diffDays < 7) return `${diffDays}d left`;
  return d.toLocaleDateString();
}

export default function TaskCard({ task, onStatusChange }: TaskCardProps) {
  const isDone = task.status === "done";
  const isCancelled = task.status === "cancelled";

  const handleQuickAction = (e: React.MouseEvent, status: TaskStatus) => {
    e.preventDefault();
    e.stopPropagation();
    onStatusChange?.(task.id, status);
  };

  return (
    <Link href={`/tasks/${task.id}`} className={styles.card}>
      <div className={styles.top}>
        <div className={styles.titleRow}>
          <h3 className={`${styles.title} ${isDone ? styles.titleDone : ""}`}>
            {task.title}
          </h3>
          <StatusBadge risk={task.risk_level} />
        </div>
        {task.description && (
          <p className={styles.desc}>{task.description}</p>
        )}
      </div>

      <div className={styles.bottom}>
        <span className={`${styles.priority} ${styles[`p_${task.priority}`]}`}>
          {PRIORITY_LABELS[task.priority]}
        </span>
        <span className={styles.deadline}>{formatDeadline(task.deadline)}</span>
        <span className={`${styles.statusPill} ${styles[`s_${task.status}`]}`}>
          {task.status.replace("_", " ")}
        </span>

        {task.tags.length > 0 && (
          <div className={styles.tags}>
            {task.tags.slice(0, 3).map((tag) => (
              <span key={tag} className={styles.tag}>
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Quick actions */}
      {onStatusChange && !isDone && !isCancelled && (
        <div className={styles.quickActions}>
          <button
            className={`${styles.quickBtn} ${styles.doneBtn}`}
            onClick={(e) => handleQuickAction(e, "done")}
            title="Mark as completed"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2.5 7l3 3 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Done
          </button>
          {task.status === "todo" && (
            <button
              className={`${styles.quickBtn} ${styles.progressBtn}`}
              onClick={(e) => handleQuickAction(e, "in_progress")}
              title="Start working"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <polygon points="5,3 11,7 5,11" fill="currentColor" />
              </svg>
              Start
            </button>
          )}
        </div>
      )}
    </Link>
  );
}
