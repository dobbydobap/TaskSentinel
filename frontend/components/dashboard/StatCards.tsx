"use client";

import type { DashboardSummary } from "@/lib/types";
import styles from "./StatCards.module.css";

interface StatCardsProps {
  summary: DashboardSummary | null;
  loading: boolean;
}

const CARDS = [
  {
    key: "total",
    label: "Total Tasks",
    sublabel: "(all categories)",
    color: "#7c5cfc",
    getValue: (s: DashboardSummary) => s.total,
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <rect x="3" y="5" width="22" height="18" rx="3" stroke="currentColor" strokeWidth="2" />
        <path d="M8 12h12M8 16h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    key: "overdue",
    label: "At Risk",
    color: "#ef4444",
    getValue: (s: DashboardSummary) => s.by_risk.red,
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <path d="M14 4l11 19H3L14 4z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M14 12v4M14 19h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    key: "progress",
    label: "In Progress",
    color: "#f59e0b",
    getValue: (s: DashboardSummary) => s.by_status.in_progress,
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <circle cx="14" cy="14" r="10" stroke="currentColor" strokeWidth="2" />
        <path d="M14 8v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    key: "done",
    label: "Completed",
    color: "#22c55e",
    getValue: (s: DashboardSummary) => s.by_status.done,
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <circle cx="14" cy="14" r="10" stroke="currentColor" strokeWidth="2" />
        <path d="M9 14l3.5 3.5 6.5-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export default function StatCards({ summary, loading }: StatCardsProps) {
  return (
    <div className={styles.grid}>
      {CARDS.map((card, i) => (
        <div
          key={card.key}
          className={styles.card}
          style={
            { "--card-color": card.color, "--card-delay": `${i * 80}ms` } as React.CSSProperties
          }
        >
          <div className={styles.iconWrap}>{card.icon}</div>
          <div className={styles.info}>
            <span className={styles.label}>{card.label}</span>
            <span className={styles.value}>
              {loading ? (
                <span className={styles.skeleton} />
              ) : (
                summary ? card.getValue(summary) : 0
              )}
              {"sublabel" in card && (
                <span className={styles.sublabel}> {(card as { sublabel?: string }).sublabel}</span>
              )}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
