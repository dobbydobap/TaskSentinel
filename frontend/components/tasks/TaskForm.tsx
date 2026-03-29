"use client";

import { useState } from "react";

import type { Priority, TaskStatus } from "@/lib/types";

import styles from "./TaskForm.module.css";

export interface TaskFormData {
  title: string;
  description?: string;
  priority: Priority;
  status: TaskStatus;
  tags: string[];
  deadline?: string;
}

interface TaskFormProps {
  initial?: {
    title: string;
    description: string;
    priority: Priority;
    status: TaskStatus;
    tags: string[];
    deadline: string;
  };
  onSubmit: (data: TaskFormData) => Promise<void>;
  submitLabel: string;
  loading: boolean;
}

export default function TaskForm({
  initial,
  onSubmit,
  submitLabel,
  loading,
}: TaskFormProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [priority, setPriority] = useState<Priority>(initial?.priority ?? "medium");
  const [status, setStatus] = useState<TaskStatus>(initial?.status ?? "todo");
  const [tags, setTags] = useState<string[]>(initial?.tags ?? []);
  const [tagInput, setTagInput] = useState("");
  const [deadline, setDeadline] = useState(initial?.deadline ?? "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      title,
      description: description || undefined,
      priority,
      status,
      tags,
      deadline: deadline || undefined,
    });
  };

  const addTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.field}>
        <label className={styles.label}>Title</label>
        <input
          type="text"
          className={styles.input}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Task title"
          required
          maxLength={200}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Description</label>
        <textarea
          className={styles.textarea}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional description..."
          rows={3}
        />
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <label className={styles.label}>Priority</label>
          <select
            className={styles.select}
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority)}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Status</label>
          <select
            className={styles.select}
            value={status}
            onChange={(e) => setStatus(e.target.value as TaskStatus)}
          >
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Deadline</label>
        <input
          type="datetime-local"
          className={styles.input}
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Tags</label>
        <div className={styles.tagInput}>
          <div className={styles.tagList}>
            {tags.map((tag) => (
              <span key={tag} className={styles.tag}>
                {tag}
                <button
                  type="button"
                  className={styles.tagRemove}
                  onClick={() => removeTag(tag)}
                >
                  x
                </button>
              </span>
            ))}
          </div>
          <input
            type="text"
            className={styles.tagField}
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            placeholder="Type and press Enter"
          />
        </div>
      </div>

      <button type="submit" className={styles.submitBtn} disabled={loading}>
        {loading ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}
