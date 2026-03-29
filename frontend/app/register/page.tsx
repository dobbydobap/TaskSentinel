"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useAuth } from "@/context/AuthContext";
import { ApiError, clearTokens } from "@/lib/api";

import styles from "../login/page.module.css";

export default function RegisterPage() {
  const { register } = useAuth();

  useEffect(() => { clearTokens(); }, []);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await register({ name, email, password });
      window.location.href = "/";
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.left}>
        <div className={styles.brand}>
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <rect width="36" height="36" rx="10" fill="#7c5cfc" />
            <path
              d="M10 18l5 5 11-11"
              stroke="#fff"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className={styles.brandTitle}>TaskSentinel</span>
        </div>

        <div className={styles.formCard}>
          <div className={styles.formHeader}>
            <h1 className={styles.formTitle}>Sign up</h1>
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="name">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                className={styles.input}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                required
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="email">
                Email address
              </label>
              <input
                id="email"
                type="email"
                className={styles.input}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                className={styles.input}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={loading}
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className={styles.switchText}>
            Already have an account?{" "}
            <Link href="/login" className={styles.switchLink}>
              Sign in
            </Link>
          </p>
        </div>
      </div>

      <div className={styles.right}>
        <div className={styles.illustration}>
          <div className={styles.illustrationGraphic}>
            <svg
              className={styles.shieldIcon}
              viewBox="0 0 200 200"
              fill="none"
            >
              <path
                d="M100 15L30 50v55c0 45 30 72 70 85 40-13 70-40 70-85V50L100 15z"
                fill="rgba(255,255,255,0.2)"
                stroke="rgba(255,255,255,0.5)"
                strokeWidth="2"
              />
              <path
                d="M100 35L50 60v40c0 33 22 53 50 63 28-10 50-30 50-63V60L100 35z"
                fill="rgba(255,255,255,0.15)"
              />
              <path
                d="M75 100l18 18 32-36"
                stroke="white"
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="100" cy="75" r="4" fill="rgba(255,255,255,0.5)" />
            </svg>
            <div className={styles.floatingShapes}>
              <div className={`${styles.shape} ${styles.shape1}`} />
              <div className={`${styles.shape} ${styles.shape2}`} />
              <div className={`${styles.shape} ${styles.shape3}`} />
              <div className={`${styles.shape} ${styles.shape4}`} />
            </div>
          </div>

          <div className={styles.illustrationText}>
            <h2 className={styles.illustrationTitle}>
              Join TaskSentinel
            </h2>
            <p className={styles.illustrationSub}>
              Start monitoring your tasks intelligently. Never miss a deadline again.
            </p>
          </div>

          <div className={styles.featurePills}>
            <span className={styles.pill}>Risk Detection</span>
            <span className={styles.pill}>Deadline Alerts</span>
            <span className={styles.pill}>Auto Monitoring</span>
          </div>
        </div>
      </div>
    </div>
  );
}
