"use client";

import styles from "./ProductivityScore.module.css";

interface ProductivityScoreProps {
  score: number;
  loading: boolean;
}

function getLabel(score: number): string {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Stable state";
  if (score >= 40) return "Needs work";
  if (score >= 20) return "At risk";
  return "Critical";
}

function getHint(score: number): string {
  if (score >= 80) return "Amazing work — keep crushing it";
  if (score >= 60) return "Keep going — you're on track";
  if (score >= 40) return "Some tasks need your attention";
  if (score >= 20) return "Several tasks are falling behind";
  return "Immediate action needed";
}

export default function ProductivityScore({ score, loading }: ProductivityScoreProps) {
  // Half-circle gauge: arc from 180° to 0° (left to right)
  const radius = 80;
  const cx = 100;
  const cy = 95;
  const circumference = Math.PI * radius; // half circle
  const filled = (score / 100) * circumference;
  const gap = circumference - filled;

  // Needle angle: 180° (left, score=0) to 0° (right, score=100)
  const needleAngle = 180 - (score / 100) * 180;
  const needleRad = (needleAngle * Math.PI) / 180;
  const needleLen = 58;
  const needleX = cx + needleLen * Math.cos(needleRad);
  const needleY = cy - needleLen * Math.sin(needleRad);

  // Tick dots along the arc
  const dots = [];
  for (let i = 0; i <= 20; i++) {
    const angle = 180 - (i / 20) * 180;
    const rad = (angle * Math.PI) / 180;
    const dotR = 68;
    const x = cx + dotR * Math.cos(rad);
    const y = cy - dotR * Math.sin(rad);
    const isFilled = i / 20 <= score / 100;
    dots.push({ x, y, isFilled });
  }

  return (
    <div className={styles.card}>
      {loading ? (
        <div className={styles.skeleton} />
      ) : (
        <>
          {/* Status indicator dot */}
          <div className={styles.statusDot} style={{
            background: score >= 60 ? "var(--risk-yellow)" : score >= 40 ? "var(--risk-yellow)" : "var(--risk-red)",
          }} />

          <div className={styles.gaugeWrap}>
            <svg viewBox="0 0 200 110" className={styles.svg}>
              <defs>
                <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#c4b5fd" />
                  <stop offset="50%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#6d28d9" />
                </linearGradient>
                <linearGradient id="gaugeBg" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="var(--bg-tertiary)" />
                  <stop offset="100%" stopColor="var(--bg-tertiary)" />
                </linearGradient>
              </defs>

              {/* Background arc */}
              <path
                d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
                fill="none"
                stroke="var(--bg-tertiary)"
                strokeWidth="14"
                strokeLinecap="round"
              />

              {/* Filled arc with gradient */}
              <path
                d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
                fill="none"
                stroke="url(#gaugeGrad)"
                strokeWidth="14"
                strokeLinecap="round"
                strokeDasharray={`${filled} ${gap}`}
                className={styles.arcFill}
              />

              {/* Tick dots */}
              {dots.map((dot, i) => (
                <circle
                  key={i}
                  cx={dot.x}
                  cy={dot.y}
                  r={1.5}
                  fill={dot.isFilled ? "rgba(255,255,255,0.6)" : "var(--text-tertiary)"}
                  opacity={dot.isFilled ? 0.8 : 0.3}
                />
              ))}

              {/* Needle */}
              <line
                x1={cx}
                y1={cy}
                x2={needleX}
                y2={needleY}
                stroke="var(--text-primary)"
                strokeWidth="2.5"
                strokeLinecap="round"
                className={styles.needle}
              />

              {/* Center dot */}
              <circle cx={cx} cy={cy} r="4" fill="var(--text-primary)" />
              <circle cx={cx} cy={cy} r="2" fill="var(--bg-secondary)" />
            </svg>
          </div>

          {/* Score number */}
          <div className={styles.scoreArea}>
            <span className={styles.scoreNum}>{Math.round(score)}</span>
          </div>

          {/* Label + hint */}
          <div className={styles.labelArea}>
            <span className={styles.label}>{getLabel(score)}</span>
            <span className={styles.hint}>{getHint(score)}</span>
          </div>
        </>
      )}
    </div>
  );
}
