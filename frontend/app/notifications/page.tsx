"use client";

import { useEffect, useState } from "react";

import { useToast } from "@/context/ToastContext";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/notificationApi";
import type { Notification } from "@/lib/types";

import styles from "./page.module.css";

type FilterTab = "all" | "unread";

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

function getTypeIcon(type: string) {
  switch (type) {
    case "overdue":
    case "risk_escalated":
      return (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path
            d="M9 2l8 14H1L9 2z"
            stroke="var(--risk-red)"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="M9 7v3M9 12.5h.01"
            stroke="var(--risk-red)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      );
    case "due_soon":
      return (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <circle cx="9" cy="9" r="7" stroke="var(--risk-yellow)" strokeWidth="1.5" />
          <path
            d="M9 5v4l2.5 1.5"
            stroke="var(--risk-yellow)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      );
    case "inactive":
      return (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <circle cx="9" cy="9" r="7" stroke="var(--text-tertiary)" strokeWidth="1.5" />
          <path
            d="M6.5 9h5"
            stroke="var(--text-tertiary)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      );
    default:
      return (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <circle cx="9" cy="9" r="7" stroke="var(--accent)" strokeWidth="1.5" />
          <path
            d="M9 6v3l2 1"
            stroke="var(--accent)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      );
  }
}

function getBorderColor(type: string): string {
  switch (type) {
    case "overdue":
    case "risk_escalated":
      return "var(--risk-red)";
    case "due_soon":
      return "var(--risk-yellow)";
    case "inactive":
      return "var(--text-tertiary)";
    default:
      return "var(--accent)";
  }
}

export default function NotificationsPage() {
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  const fetchNotifications = (tab: FilterTab, pg: number) => {
    setLoading(true);
    getNotifications(tab === "unread", pg)
      .then((res) => {
        setNotifications(res.notifications);
        setTotal(res.total);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchNotifications(activeTab, page);
  }, [activeTab, page]);

  const handleTabChange = (tab: FilterTab) => {
    setActiveTab(tab);
    setPage(1);
  };

  const handleMarkRead = async (id: number) => {
    try {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
      );
    } catch {
      showToast("Failed to mark as read", "error");
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      showToast("All notifications marked as read");
    } catch {
      showToast("Failed to mark all as read", "error");
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Notifications</h1>
          {unreadCount > 0 && (
            <span className={styles.badge}>{unreadCount}</span>
          )}
        </div>
        {unreadCount > 0 && (
          <button className={styles.markAllBtn} onClick={handleMarkAllRead}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M3 8.5l3.5 3.5L13 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Mark All Read
          </button>
        )}
      </div>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === "all" ? styles.tabActive : ""}`}
          onClick={() => handleTabChange("all")}
        >
          All
        </button>
        <button
          className={`${styles.tab} ${activeTab === "unread" ? styles.tabActive : ""}`}
          onClick={() => handleTabChange("unread")}
        >
          Unread
        </button>
      </div>

      {loading ? (
        <div className={styles.list}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className={styles.skeletonItem}>
              <div className={styles.skeletonIcon} />
              <div className={styles.skeletonContent}>
                <div className={styles.skeletonLine} />
                <div className={styles.skeletonLineShort} />
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <path
                d="M24 6a12 12 0 00-12 12v8l-4 6.5a1.2 1.2 0 001 1.8h30a1.2 1.2 0 001-1.8L36 26v-8A12 12 0 0024 6z"
                stroke="var(--text-tertiary)"
                strokeWidth="2"
              />
              <path
                d="M20 36a4 4 0 008 0"
                stroke="var(--text-tertiary)"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <p className={styles.emptyTitle}>
            {activeTab === "unread"
              ? "No unread notifications"
              : "No notifications yet"}
          </p>
          <span className={styles.emptyHint}>
            {activeTab === "unread"
              ? "You're all caught up!"
              : "Notifications will appear here when your tasks need attention"}
          </span>
        </div>
      ) : (
        <div className={styles.list}>
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`${styles.item} ${!n.is_read ? styles.unread : ""}`}
              style={{ borderLeftColor: getBorderColor(n.type) }}
              onClick={() => !n.is_read && handleMarkRead(n.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !n.is_read) handleMarkRead(n.id);
              }}
            >
              <div className={styles.icon}>{getTypeIcon(n.type)}</div>
              <div className={styles.content}>
                <p className={styles.message}>{n.message}</p>
                <span className={styles.time}>{timeAgo(n.created_at)}</span>
              </div>
              {!n.is_read && <div className={styles.unreadDot} />}
            </div>
          ))}
        </div>
      )}

      {total > 20 && (
        <div className={styles.pagination}>
          <button
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className={styles.pageBtn}
          >
            Previous
          </button>
          <span className={styles.pageInfo}>Page {page}</span>
          <button
            disabled={notifications.length < 20}
            onClick={() => setPage(page + 1)}
            className={styles.pageBtn}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
