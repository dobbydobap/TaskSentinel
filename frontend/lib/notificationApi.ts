import { apiFetch } from "./api";
import type { Notification, NotificationListResponse } from "./types";

export async function getNotifications(
  unread: boolean = false,
  page: number = 1,
): Promise<NotificationListResponse> {
  const params = new URLSearchParams();
  if (unread) params.set("unread", "true");
  params.set("page", String(page));
  return apiFetch<NotificationListResponse>(`/notifications?${params}`);
}

export async function getUnreadCount(): Promise<number> {
  const data = await apiFetch<{ count: number }>("/notifications/count");
  return data.count;
}

export async function markNotificationRead(id: number): Promise<Notification> {
  return apiFetch<Notification>(`/notifications/${id}/read`, { method: "PATCH" });
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiFetch("/notifications/read-all", { method: "POST" });
}
