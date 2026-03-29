"use client";

import { useEffect, useState } from "react";

import { getQuote } from "@/lib/dashboardApi";
import type { Quote } from "@/lib/types";

import styles from "./QuoteBanner.module.css";

export default function QuoteBanner() {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    getQuote().then(setQuote).catch(() => {});
  }, []);

  const refreshQuote = () => {
    setFade(false);
    setTimeout(() => {
      getQuote()
        .then((q) => {
          setQuote(q);
          setFade(true);
        })
        .catch(() => setFade(true));
    }, 300);
  };

  return (
    <div className={styles.banner}>
      <div className={styles.quoteIcon}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M3 12.5c0-3.5 2-6.5 5-8l1 1.5C6.5 8 6 10.5 6 12.5h2.5A1.5 1.5 0 0110 14v4a1.5 1.5 0 01-1.5 1.5h-4A1.5 1.5 0 013 18v-5.5zM14 12.5c0-3.5 2-6.5 5-8l1 1.5c-2.5 2-3 4.5-3 6.5h2.5A1.5 1.5 0 0121 14v4a1.5 1.5 0 01-1.5 1.5h-4A1.5 1.5 0 0114 18v-5.5z"
            fill="currentColor"
            opacity="0.5"
          />
        </svg>
      </div>
      <div className={`${styles.quoteText} ${fade ? styles.fadeIn : styles.fadeOut}`}>
        {quote ? (
          <>
            <p className={styles.text}>&ldquo;{quote.text}&rdquo;</p>
            <p className={styles.author}>— {quote.author}</p>
          </>
        ) : (
          <p className={styles.text}>Loading inspiration...</p>
        )}
      </div>
      <button className={styles.refreshBtn} onClick={refreshQuote} title="New quote">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M13.65 2.35A7 7 0 103.17 12.83" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M14 6V2h-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}
