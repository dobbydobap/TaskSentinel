"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import StatusBadge from "@/components/tasks/StatusBadge";
import TaskForm from "@/components/tasks/TaskForm";
import type { TaskFormData } from "@/components/tasks/TaskForm";
import { useToast } from "@/context/ToastContext";
import { deleteTask, getTask, getTaskActivity, updateTask } from "@/lib/taskApi";
import type { Activity, Task } from "@/lib/types";

import styles from "./page.module.css";

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { showToast } = useToast();
  const [task, setTask] = useState<Task | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([getTask(id), getTaskActivity(id)])
      .then(([t, a]) => {
        setTask(t);
        setActivities(a.activities);
      })
      .catch(() => {
        showToast("Task not found", "error");
        router.push("/tasks");
      })
      .finally(() => setLoading(false));
  }, [id, router, showToast]);

  const handleUpdate = async (data: TaskFormData) => {
    if (!id) return;
    setSaving(true);
    try {
      const updated = await updateTask(id, data);
      setTask(updated);
      setEditing(false);
      showToast("Task updated!");
      // Refresh activity
      const a = await getTaskActivity(id);
      setActivities(a.activities);
    } catch {
      showToast("Failed to update task", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !confirm("Delete this task?")) return;
    try {
      await deleteTask(id);
      showToast("Task deleted");
      router.push("/tasks");
    } catch {
      showToast("Failed to delete", "error");
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.skeleton} style={{ height: 200 }} />
      </div>
    );
  }

  if (!task) return null;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.back} onClick={() => router.push("/tasks")}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to Tasks
        </button>
      </div>

      {editing ? (
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Edit Task</h2>
          <TaskForm
            initial={{
              title: task.title,
              description: task.description ?? "",
              priority: task.priority,
              status: task.status,
              tags: task.tags,
              deadline: task.deadline ? task.deadline.slice(0, 16) : "",
            }}
            onSubmit={handleUpdate}
            submitLabel="Save Changes"
            loading={saving}
          />
          <button className={styles.cancelBtn} onClick={() => setEditing(false)}>
            Cancel
          </button>
        </div>
      ) : (
        <div className={styles.card}>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>{task.title}</h1>
            <StatusBadge risk={task.risk_level} />
          </div>

          {task.description && (
            <p className={styles.desc}>{task.description}</p>
          )}

          <div className={styles.meta}>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Priority</span>
              <span className={styles.metaValue}>{task.priority}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Status</span>
              <span className={styles.metaValue}>{task.status.replace("_", " ")}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Deadline</span>
              <span className={styles.metaValue}>
                {task.deadline ? new Date(task.deadline).toLocaleString() : "None"}
              </span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Created</span>
              <span className={styles.metaValue}>{timeAgo(task.created_at)}</span>
            </div>
          </div>

          {task.tags.length > 0 && (
            <div className={styles.tags}>
              {task.tags.map((tag) => (
                <span key={tag} className={styles.tag}>{tag}</span>
              ))}
            </div>
          )}

          <div className={styles.actions}>
            <button className={styles.editBtn} onClick={() => setEditing(true)}>
              Edit Task
            </button>
            <button className={styles.deleteBtn} onClick={handleDelete}>
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Activity Log */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Activity Log</h2>
        {activities.length === 0 ? (
          <p className={styles.emptyActivity}>No activity recorded yet.</p>
        ) : (
          <div className={styles.activityList}>
            {activities.map((a) => (
              <div key={a.id} className={styles.activityItem}>
                <div className={styles.activityDot} />
                <span className={styles.activityAction}>{a.action.replace("_", " ")}</span>
                <span className={styles.activityTime}>{timeAgo(a.created_at)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
