"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import TaskForm from "@/components/tasks/TaskForm";
import type { TaskFormData } from "@/components/tasks/TaskForm";
import { useToast } from "@/context/ToastContext";
import { createTask } from "@/lib/taskApi";

import styles from "./page.module.css";

export default function NewTaskPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: TaskFormData) => {
    setLoading(true);
    try {
      await createTask(data);
      showToast("Task created successfully!");
      router.push("/tasks");
    } catch {
      showToast("Failed to create task", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Link href="/tasks" className={styles.backLink}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M10 12L6 8l4-4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Back to Tasks
        </Link>
        <h1 className={styles.title}>Create New Task</h1>
      </div>

      <div className={styles.formCard}>
        <TaskForm
          onSubmit={handleSubmit}
          submitLabel="Create Task"
          loading={loading}
        />
      </div>
    </div>
  );
}
