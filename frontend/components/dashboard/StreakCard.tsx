"use client";

import { useEffect, useState } from "react";

import { getCalendarStreak } from "@/lib/dashboardApi";
import type { CalendarStreak } from "@/lib/types";

import styles from "./StreakCard.module.css";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month - 1, 1).getDay();
}

export default function StreakCard() {
  const [data, setData] = useState<CalendarStreak | null>(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);

  useEffect(() => {
    getCalendarStreak(year, month).then(setData).catch(() => {});
  }, [year, month]);

  const goToPrev = () => {
    if (month === 1) {
      setMonth(12);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const goToNext = () => {
    const now = new Date();
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    if (nextYear > now.getFullYear() || (nextYear === now.getFullYear() && nextMonth > now.getMonth() + 1)) {
      return;
    }
    setMonth(nextMonth);
    setYear(nextYear);
  };

  const today = new Date();
  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth() + 1;
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);

  const activeDatesSet = new Set(data?.active_dates ?? []);

  const isActive = (day: number) => {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return activeDatesSet.has(dateStr);
  };

  const isToday = (day: number) => {
    return isCurrentMonth && day === today.getDate();
  };

  // Build calendar grid cells
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className={styles.card}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.navBtn} onClick={goToPrev} title="Previous month">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3l-5 5 5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <div className={styles.monthLabel}>
          <span className={styles.monthName}>{MONTH_NAMES[month - 1]}</span>
          <span className={styles.yearLabel}>{year}</span>
        </div>

        <div className={styles.headerRight}>
          {data && data.current_streak > 0 && (
            <div className={styles.streakBadge}>
              <svg width="14" height="14" viewBox="0 0 32 32" fill="none">
                <path d="M16 2c0 6-4 8-6 12s0 10 6 14c6-4 8-10 6-14S16 8 16 2z" fill="#f59e0b" />
              </svg>
              <span>{data.current_streak}</span>
            </div>
          )}
          <button className={styles.navBtn} onClick={goToNext} title="Next month">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* Day names */}
      <div className={styles.dayNames}>
        {DAY_NAMES.map((d) => (
          <span key={d} className={styles.dayName}>{d}</span>
        ))}
      </div>

      {/* Calendar grid */}
      <div className={styles.grid}>
        {cells.map((day, i) => (
          <div
            key={i}
            className={`${styles.cell} ${day === null ? styles.empty : ""} ${day && isActive(day) ? styles.active : ""} ${day && isToday(day) ? styles.today : ""}`}
          >
            {day && <span className={styles.dayNum}>{day}</span>}
          </div>
        ))}
      </div>

      {/* Footer with legend */}
      <div className={styles.footer}>
        <span className={styles.message}>
          {data?.message ?? "Loading..."}
        </span>
        <div className={styles.legend}>
          <div className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: "var(--accent)" }} />
            <span className={styles.legendText}>Completed</span>
          </div>
          <div className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: "var(--risk-yellow)" }} />
            <span className={styles.legendText}>Deadline</span>
          </div>
        </div>
      </div>
    </div>
  );
}
