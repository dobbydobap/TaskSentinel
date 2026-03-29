"use client";

import type { Activity } from "@/lib/types";
import styles from "./ActivityFeed.module.css";

interface ActivityFeedProps {
  activities: Activity[];
  loading: boolean;
}

function getActionStyle(action: string): { bg: string; color: string; icon: string } {
  switch (action) {
    case "created":
      return { bg: "rgba(124,92,252,0.12)", color: "var(--accent)", icon: "+" };
    case "risk_changed":
      return { bg: "rgba(239,68,68,0.12)", color: "var(--risk-red)", icon: "!" };
    case "status_changed":
      return { bg: "rgba(245,158,11,0.12)", color: "var(--risk-yellow)", icon: "~" };
    case "updated":
      return { bg: "rgba(34,197,94,0.12)", color: "var(--risk-green)", icon: "^" };
    default:
      return { bg: "var(--bg-tertiary)", color: "var(--text-tertiary)", icon: "?" };
  }
}

function formatAction(activity: Activity): string {
  const detail = activity.detail ? JSON.parse(activity.detail) : null;
  switch (activity.action) {
    case "created":
      return "created new task";
    case "risk_changed":
      return detail
        ? `risk changed: ${detail.old} → ${detail.new}`
        : "risk level changed";
    case "status_changed":
      return detail
        ? `moved to "${detail.new?.replace("_", " ")}"`
        : "status changed";
    case "updated":
      return "task updated";
    default:
      return activity.action;
  }
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours} hr ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

export default function ActivityFeed({ activities, loading }: ActivityFeedProps) {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.title}>Recent Activity</h3>
      </div>

      {loading ? (
        <div className={styles.skeletonList}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={styles.skeletonItem} />
          ))}
        </div>
      ) : activities.length === 0 ? (
        <div className={styles.empty}>
          <p>No activity yet. Create a task to get started!</p>
        </div>
      ) : (
        <div className={styles.list}>
          {activities.map((activity, i) => {
            const style = getActionStyle(activity.action);
            return (
              <div
                key={activity.id}
                className={styles.item}
                style={{ "--item-delay": `${i * 60}ms` } as React.CSSProperties}
              >
                <div
                  className={styles.iconWrap}
                  style={{ background: style.bg, color: style.color }}
                >
                  {style.icon}
                </div>
                <div className={styles.content}>
                  <span className={styles.action}>
                    {timeAgo(activity.created_at)}: {formatAction(activity)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
