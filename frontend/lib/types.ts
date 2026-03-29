// ============================================
// TaskSentinel — Shared TypeScript Types
// ============================================

// Auth
export interface User {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  created_at: string;
}

export interface ProfileUpdateData {
  name?: string;
  email?: string;
  phone?: string;
}

export interface PasswordChangeData {
  current_password: string;
  new_password: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
}

export interface LoginData {
  email: string;
  password: string;
}

// Tasks
export type Priority = "critical" | "high" | "medium" | "low";
export type TaskStatus = "todo" | "in_progress" | "done" | "cancelled";
export type RiskLevel = "red" | "yellow" | "green";

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  priority: Priority;
  status: TaskStatus;
  risk_level: RiskLevel;
  tags: string[];
  deadline: string | null;
  last_activity_at: string;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface TaskCreate {
  title: string;
  description?: string;
  priority?: Priority;
  status?: TaskStatus;
  tags?: string[];
  deadline?: string;
}

export interface TaskUpdate {
  title?: string;
  description?: string;
  priority?: Priority;
  status?: TaskStatus;
  tags?: string[];
  deadline?: string;
}

export interface TaskListResponse {
  tasks: Task[];
  total: number;
  page: number;
  size: number;
}

export interface TaskFilters {
  status?: TaskStatus;
  risk?: RiskLevel;
  priority?: Priority;
  tag?: string;
  sort?: string;
  order?: "asc" | "desc";
  page?: number;
  size?: number;
}

// Activity
export interface Activity {
  id: number;
  task_id: string;
  action: string;
  detail: string | null;
  created_at: string;
}

export interface ActivityListResponse {
  activities: Activity[];
  total: number;
}

// Notifications
export interface Notification {
  id: number;
  task_id: string;
  type: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface NotificationListResponse {
  notifications: Notification[];
  total: number;
}

// Dashboard
export interface StatusCounts {
  todo: number;
  in_progress: number;
  done: number;
  cancelled: number;
}

export interface RiskCounts {
  red: number;
  yellow: number;
  green: number;
}

export interface DashboardSummary {
  total: number;
  by_status: StatusCounts;
  by_risk: RiskCounts;
  overdue_count: number;
  productivity_score: number;
}

export interface RiskTrendPoint {
  snapshot_at: string;
  red_count: number;
  yellow_count: number;
  green_count: number;
  total_tasks: number;
}

export interface Quote {
  text: string;
  author: string;
}

export interface Streak {
  current_streak: number;
  message: string;
}

export interface CalendarStreak {
  current_streak: number;
  message: string;
  active_dates: string[];
  year: number;
  month: number;
}
