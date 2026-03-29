import { apiFetch } from "./api";
import type {
  ActivityListResponse,
  Task,
  TaskCreate,
  TaskFilters,
  TaskListResponse,
  TaskUpdate,
} from "./types";

export async function getTasks(filters: TaskFilters = {}): Promise<TaskListResponse> {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.risk) params.set("risk", filters.risk);
  if (filters.priority) params.set("priority", filters.priority);
  if (filters.tag) params.set("tag", filters.tag);
  if (filters.sort) params.set("sort", filters.sort);
  if (filters.order) params.set("order", filters.order);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.size) params.set("size", String(filters.size));

  const query = params.toString();
  return apiFetch<TaskListResponse>(`/tasks${query ? `?${query}` : ""}`);
}

export async function getTask(id: string): Promise<Task> {
  return apiFetch<Task>(`/tasks/${id}`);
}

export async function createTask(data: TaskCreate): Promise<Task> {
  return apiFetch<Task>("/tasks", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateTask(id: string, data: TaskUpdate): Promise<Task> {
  return apiFetch<Task>(`/tasks/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function updateTaskStatus(id: string, status: string): Promise<Task> {
  return apiFetch<Task>(`/tasks/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function deleteTask(id: string): Promise<void> {
  return apiFetch<void>(`/tasks/${id}`, { method: "DELETE" });
}

export async function getTaskActivity(
  id: string,
  page: number = 1,
): Promise<ActivityListResponse> {
  return apiFetch<ActivityListResponse>(`/tasks/${id}/activity?page=${page}`);
}
