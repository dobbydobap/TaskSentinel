"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import styles from "./Sidebar.module.css";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: "dashboard" },
  { href: "/tasks", label: "Tasks", icon: "tasks" },
  { href: "/notifications", label: "Notifications", icon: "notifications" },
];

function NavIcon({ icon }: { icon: string }) {
  switch (icon) {
    case "dashboard":
      return (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <rect x="1" y="1" width="6.5" height="6.5" rx="2" fill="currentColor" />
          <rect x="10.5" y="1" width="6.5" height="6.5" rx="2" fill="currentColor" opacity="0.5" />
          <rect x="1" y="10.5" width="6.5" height="6.5" rx="2" fill="currentColor" opacity="0.5" />
          <rect x="10.5" y="10.5" width="6.5" height="6.5" rx="2" fill="currentColor" />
        </svg>
      );
    case "tasks":
      return (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <rect x="1" y="2" width="16" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M5.5 7.5l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="5.5" y1="12.5" x2="12.5" y2="12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
        </svg>
      );
    case "notifications":
      return (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M9 1.5a4.5 4.5 0 00-4.5 4.5v3L3 11.25a.45.45 0 00.39.68h11.22a.45.45 0 00.39-.68L13.5 9V6A4.5 4.5 0 009 1.5z" fill="currentColor" />
          <path d="M7 13a2 2 0 004 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      );
    default:
      return null;
  }
}

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <div className={styles.logoIcon}>
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <rect width="40" height="40" rx="12" fill="#7c5cfc" />
            <path
              d="M12 20l6 6 10-10"
              stroke="#fff"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      <nav className={styles.nav}>
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navItem} ${isActive ? styles.active : ""}`}
            >
              <span className={styles.navIcon}>
                <NavIcon icon={item.icon} />
              </span>
              <span className={styles.navLabel}>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Decorative illustration at bottom */}
      <div className={styles.decoration}>
        <svg viewBox="0 0 200 160" fill="none" className={styles.decoSvg}>
          {/* Abstract plant/leaf shapes */}
          <ellipse cx="100" cy="140" rx="80" ry="20" fill="rgba(124,92,252,0.15)" />
          <path
            d="M90 140c0 0-10-40-30-55s-15-40 5-50c20-10 35 10 35 10"
            stroke="rgba(124,92,252,0.4)"
            strokeWidth="3"
            fill="rgba(124,92,252,0.08)"
          />
          <path
            d="M110 140c0 0 10-35 30-50s15-35-5-45c-20-10-35 10-35 10"
            stroke="rgba(52,211,153,0.5)"
            strokeWidth="3"
            fill="rgba(52,211,153,0.08)"
          />
          <circle cx="70" cy="50" r="4" fill="rgba(251,191,36,0.5)" />
          <circle cx="140" cy="60" r="3" fill="rgba(244,114,182,0.5)" />
          <circle cx="100" cy="35" r="5" fill="rgba(124,92,252,0.3)" />
        </svg>
      </div>
    </aside>
  );
}
