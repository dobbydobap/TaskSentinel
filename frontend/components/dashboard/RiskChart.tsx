"use client";

import type { RiskCounts } from "@/lib/types";
import styles from "./RiskChart.module.css";

interface RiskChartProps {
  risks: RiskCounts | null;
  loading: boolean;
}

export default function RiskChart({ risks, loading }: RiskChartProps) {
  const total = risks ? risks.red + risks.yellow + risks.green : 0;

  const getPercent = (value: number) =>
    total > 0 ? Math.round((value / total) * 100) : 0;

  // SVG donut chart
  const radius = 60;
  const circumference = 2 * Math.PI * radius;

  const redPct = risks ? getPercent(risks.red) : 0;
  const yellowPct = risks ? getPercent(risks.yellow) : 0;
  const greenPct = risks ? getPercent(risks.green) : 0;

  const redLen = (redPct / 100) * circumference;
  const yellowLen = (yellowPct / 100) * circumference;
  const greenLen = (greenPct / 100) * circumference;

  const redOffset = 0;
  const yellowOffset = -redLen;
  const greenOffset = -(redLen + yellowLen);

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.title}>Risk Distribution</h3>
        <span className={styles.subtitle}>All tasks</span>
      </div>

      {loading ? (
        <div className={styles.skeletonChart} />
      ) : (
        <div className={styles.chartArea}>
          <div className={styles.donut}>
            <svg viewBox="0 0 160 160" className={styles.svg}>
              {/* Background circle */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                fill="none"
                stroke="var(--bg-tertiary)"
                strokeWidth="20"
              />
              {total > 0 && (
                <>
                  <circle
                    cx="80"
                    cy="80"
                    r={radius}
                    fill="none"
                    stroke="var(--risk-green)"
                    strokeWidth="20"
                    strokeDasharray={`${greenLen} ${circumference - greenLen}`}
                    strokeDashoffset={greenOffset}
                    strokeLinecap="round"
                    className={styles.segment}
                  />
                  <circle
                    cx="80"
                    cy="80"
                    r={radius}
                    fill="none"
                    stroke="var(--risk-yellow)"
                    strokeWidth="20"
                    strokeDasharray={`${yellowLen} ${circumference - yellowLen}`}
                    strokeDashoffset={yellowOffset}
                    strokeLinecap="round"
                    className={styles.segment}
                  />
                  <circle
                    cx="80"
                    cy="80"
                    r={radius}
                    fill="none"
                    stroke="var(--risk-red)"
                    strokeWidth="20"
                    strokeDasharray={`${redLen} ${circumference - redLen}`}
                    strokeDashoffset={redOffset}
                    strokeLinecap="round"
                    className={styles.segment}
                  />
                </>
              )}
            </svg>
            <div className={styles.donutCenter}>
              <span className={styles.donutTotal}>{total}</span>
              <span className={styles.donutLabel}>Tasks</span>
            </div>
          </div>

          <div className={styles.legend}>
            {[
              { label: "Total Risks", color: "var(--risk-red)", value: risks?.red ?? 0, pct: redPct },
              { label: "Warning", color: "var(--risk-yellow)", value: risks?.yellow ?? 0, pct: yellowPct },
              { label: "On Track", color: "var(--risk-green)", value: risks?.green ?? 0, pct: greenPct },
            ].map((item) => (
              <div key={item.label} className={styles.legendItem}>
                <span className={styles.dot} style={{ background: item.color }} />
                <span className={styles.legendLabel}>{item.label}</span>
                <div className={styles.legendBar}>
                  <div
                    className={styles.legendBarFill}
                    style={{ width: `${item.pct}%`, background: item.color }}
                  />
                </div>
                <span className={styles.legendValue}>{item.value}</span>
                <span className={styles.legendPct}>{item.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
