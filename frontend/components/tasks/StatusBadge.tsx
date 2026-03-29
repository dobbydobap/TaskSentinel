"use client";

import type { RiskLevel } from "@/lib/types";
import styles from "./StatusBadge.module.css";

interface StatusBadgeProps {
  risk: RiskLevel;
}

const LABELS: Record<RiskLevel, string> = {
  red: "At Risk",
  yellow: "Warning",
  green: "On Track",
};

export default function StatusBadge({ risk }: StatusBadgeProps) {
  return (
    <span className={`${styles.badge} ${styles[risk]}`}>
      <span className={styles.dot} />
      {LABELS[risk]}
    </span>
  );
}
