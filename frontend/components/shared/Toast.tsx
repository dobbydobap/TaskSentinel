"use client";

import styles from "./Toast.module.css";

interface ToastProps {
  message: string;
  type: "success" | "error" | "info";
  onClose: () => void;
}

export default function Toast({ message, type, onClose }: ToastProps) {
  return (
    <div className={`${styles.toast} ${styles[type]}`} onClick={onClose}>
      <span className={styles.icon}>
        {type === "success" && "✓"}
        {type === "error" && "✕"}
        {type === "info" && "ℹ"}
      </span>
      <span className={styles.message}>{message}</span>
    </div>
  );
}
