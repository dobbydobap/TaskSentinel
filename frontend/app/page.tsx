"use client";

import { useEffect, useState } from "react";

import ActivityFeed from "@/components/dashboard/ActivityFeed";
import ProductivityScore from "@/components/dashboard/ProductivityScore";
import QuoteBanner from "@/components/dashboard/QuoteBanner";
import RiskChart from "@/components/dashboard/RiskChart";
import StatCards from "@/components/dashboard/StatCards";
import StreakCard from "@/components/dashboard/StreakCard";
import { getDashboardSummary, getRecentActivity } from "@/lib/dashboardApi";
import type { Activity, DashboardSummary } from "@/lib/types";

import styles from "./page.module.css";

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getDashboardSummary(), getRecentActivity()])
      .then(([sum, acts]) => {
        setSummary(sum);
        setActivities(acts);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className={styles.dashboard}>
      {/* Motivational Quote Banner */}
      <QuoteBanner />

      {/* Stat Cards Row */}
      <StatCards summary={summary} loading={loading} />

      {/* Main Grid: Charts + Activity */}
      <div className={styles.mainGrid}>
        <div className={styles.leftCol}>
          <RiskChart
            risks={summary?.by_risk ?? null}
            loading={loading}
          />
          <ActivityFeed activities={activities} loading={loading} />
        </div>

        <div className={styles.rightCol}>
          <ProductivityScore
            score={summary?.productivity_score ?? 0}
            loading={loading}
          />
          <StreakCard />
        </div>
      </div>
    </div>
  );
}
