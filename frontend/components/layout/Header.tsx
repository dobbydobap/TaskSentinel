"use client";

import { useEffect, useRef, useState } from "react";

import { useAuth } from "@/context/AuthContext";
import { getUnreadCount } from "@/lib/notificationApi";

import styles from "./Header.module.css";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function Header() {
  const { user, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [darkMode, setDarkMode] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [time, setTime] = useState("");
  const [dateStr, setDateStr] = useState("");

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") {
      setDarkMode(true);
      document.documentElement.setAttribute("data-theme", "dark");
    }
  }, []);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      setDateStr(`${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`);
    };
    updateClock();
    const interval = setInterval(updateClock, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!user) return;

    const fetchCount = () => {
      getUnreadCount().then(setUnreadCount).catch(() => {});
    };

    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const toggleTheme = () => {
    const next = !darkMode;
    setDarkMode(next);
    if (next) {
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
      localStorage.setItem("theme", "light");
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <header className={styles.header}>
      <div className={styles.greeting}>
        <span className={styles.greetingText}>
          {getGreeting()},{" "}
          <strong className={styles.userName}>{user?.name || "there"}</strong>
        </span>
      </div>

      <div className={styles.searchBar}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={styles.searchIcon}>
          <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M11 11l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <input
          type="text"
          placeholder="Search tasks..."
          className={styles.searchInput}
        />
      </div>

      <div className={styles.dateTime}>
        <span className={styles.date}>{dateStr}</span>
        <span className={styles.time}>{time}</span>
      </div>

      <div className={styles.actions}>
        <button
          className={styles.iconBtn}
          onClick={toggleTheme}
          title={darkMode ? "Light mode" : "Dark mode"}
        >
          {darkMode ? (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <circle cx="9" cy="9" r="3.5" fill="currentColor" />
              <path d="M9 1.5v1.5M9 15v1.5M1.5 9H3M15 9h1.5M3.7 3.7l1.06 1.06M13.24 13.24l1.06 1.06M3.7 14.3l1.06-1.06M13.24 4.76l1.06-1.06" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M15.56 11.56A7 7 0 016.44 2.44 7.003 7.003 0 109 16a6.97 6.97 0 006.56-4.44z" fill="currentColor" />
            </svg>
          )}
        </button>

        <a href="/notifications" className={styles.iconBtn}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M9 1.5a4.5 4.5 0 00-4.5 4.5v3L3 11.25a.45.45 0 00.39.68h11.22a.45.45 0 00.39-.68L13.5 9V6A4.5 4.5 0 009 1.5z" fill="currentColor" />
            <path d="M7 13a2 2 0 004 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          {unreadCount > 0 && (
            <span className={styles.badge}>
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </a>

        <div className={styles.userMenu} ref={menuRef}>
          <button
            className={styles.userBtn}
            onClick={() => setMenuOpen(!menuOpen)}
            title="Profile menu"
          >
            <div className={styles.avatar}>
              {user?.name?.charAt(0)?.toUpperCase() || "?"}
            </div>
          </button>

          {menuOpen && (
            <div className={styles.dropdown}>
              <div className={styles.dropdownHeader}>
                <div className={styles.dropdownAvatar}>
                  {user?.name?.charAt(0)?.toUpperCase() || "?"}
                </div>
                <div className={styles.dropdownInfo}>
                  <span className={styles.dropdownName}>{user?.name}</span>
                  <span className={styles.dropdownEmail}>{user?.email}</span>
                </div>
              </div>
              <div className={styles.dropdownDivider} />
              <a href="/profile" className={styles.dropdownItem}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M12.5 14v-1.5a3 3 0 00-3-3h-3a3 3 0 00-3 3V14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <circle cx="8" cy="4.5" r="2.5" stroke="currentColor" strokeWidth="1.5" />
                </svg>
                My Profile
              </a>
              <button className={styles.dropdownItem} onClick={logout}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M6 14H3.5A1.5 1.5 0 012 12.5v-9A1.5 1.5 0 013.5 2H6M11 11l3-3-3-3M14 8H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
