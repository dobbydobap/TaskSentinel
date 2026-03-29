"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import type { ReactNode } from "react";

import { useAuth } from "@/context/AuthContext";

import Header from "./Header";
import Sidebar from "./Sidebar";
import styles from "./AppShell.module.css";

const PUBLIC_ROUTES = ["/login", "/register"];

export default function AppShell({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

  useEffect(() => {
    if (!loading && !user && !isPublicRoute) {
      window.location.href = "/login";
    }
  }, [loading, user, isPublicRoute]);

  // Public routes render immediately — no loading gate
  if (isPublicRoute) {
    return <>{children}</>;
  }

  // Protected routes wait for auth check
  if (loading) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.spinner} />
        <span>Loading TaskSentinel...</span>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className={styles.shell}>
      <Sidebar />
      <div className={styles.main}>
        <Header />
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
