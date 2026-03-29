import { apiFetch } from "./api";
import type {
  Activity,
  CalendarStreak,
  DashboardSummary,
  Quote,
  RiskTrendPoint,
  Streak,
} from "./types";

export async function getDashboardSummary(): Promise<DashboardSummary> {
  return apiFetch<DashboardSummary>("/dashboard/summary");
}

export async function getRiskTrend(days: number = 7): Promise<RiskTrendPoint[]> {
  const data = await apiFetch<{ trend: RiskTrendPoint[] }>(
    `/dashboard/risk-trend?days=${days}`,
  );
  return data.trend;
}

export async function getRecentActivity(): Promise<Activity[]> {
  const data = await apiFetch<{ activities: Activity[] }>(
    "/dashboard/recent-activity",
  );
  return data.activities;
}

export async function getQuote(): Promise<Quote> {
  return apiFetch<Quote>("/dashboard/quote");
}

export async function getStreak(): Promise<Streak> {
  return apiFetch<Streak>("/dashboard/streak");
}

export async function getCalendarStreak(
  year?: number,
  month?: number,
): Promise<CalendarStreak> {
  const params = new URLSearchParams();
  if (year) params.set("year", String(year));
  if (month) params.set("month", String(month));
  const query = params.toString();
  return apiFetch<CalendarStreak>(
    `/dashboard/calendar-streak${query ? `?${query}` : ""}`,
  );
}
