"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import TaskCard from "@/components/tasks/TaskCard";
import { useToast } from "@/context/ToastContext";
import { getTasks, updateTaskStatus } from "@/lib/taskApi";
import type { Priority, RiskLevel, Task, TaskStatus } from "@/lib/types";

import styles from "./page.module.css";

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "">("");
  const [riskFilter, setRiskFilter] = useState<RiskLevel | "">("");
  const [priorityFilter, setPriorityFilter] = useState<Priority | "">("");
  const [page, setPage] = useState(1);
  const { showToast } = useToast();

  const handleStatusChange = async (taskId: string, status: TaskStatus) => {
    try {
      const updated = await updateTaskStatus(taskId, status);
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: updated.status, risk_level: updated.risk_level, completed_at: updated.completed_at } : t))
      );
      showToast(
        status === "done" ? "Task marked as completed!" : "Task started!",
        "success"
      );
    } catch {
      showToast("Failed to update task", "error");
    }
  };

  useEffect(() => {
    setLoading(true);
    getTasks({
      status: statusFilter || undefined,
      risk: riskFilter || undefined,
      priority: priorityFilter || undefined,
      page,
      size: 12,
    })
      .then((res) => {
        setTasks(res.tasks);
        setTotal(res.total);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [statusFilter, riskFilter, priorityFilter, page]);

  const totalPages = Math.ceil(total / 12);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Tasks</h1>
        <Link href="/tasks/new" className={styles.addBtn}>
          + New Task
        </Link>
      </div>

      <div className={styles.filters}>
        <select
          className={styles.filter}
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value as TaskStatus | ""); setPage(1); }}
        >
          <option value="">All Status</option>
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="done">Done</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <select
          className={styles.filter}
          value={riskFilter}
          onChange={(e) => { setRiskFilter(e.target.value as RiskLevel | ""); setPage(1); }}
        >
          <option value="">All Risk</option>
          <option value="red">At Risk</option>
          <option value="yellow">Warning</option>
          <option value="green">On Track</option>
        </select>

        <select
          className={styles.filter}
          value={priorityFilter}
          onChange={(e) => { setPriorityFilter(e.target.value as Priority | ""); setPage(1); }}
        >
          <option value="">All Priority</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        <span className={styles.count}>{total} task{total !== 1 ? "s" : ""}</span>
      </div>

      {loading ? (
        <div className={styles.grid}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className={styles.skeleton} />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className={styles.empty}>
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
            <rect x="8" y="12" width="48" height="40" rx="6" stroke="var(--text-tertiary)" strokeWidth="2" />
            <path d="M24 28l6 6 12-12" stroke="var(--text-tertiary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p>No tasks found. Create your first task!</p>
          <Link href="/tasks/new" className={styles.addBtn}>
            + New Task
          </Link>
        </div>
      ) : (
        <>
          <div className={styles.grid}>
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} onStatusChange={handleStatusChange} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                className={styles.pageBtn}
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </button>
              <span className={styles.pageInfo}>
                Page {page} of {totalPages}
              </span>
              <button
                className={styles.pageBtn}
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
