"use client";

import { useState } from "react";

import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { changePassword, updateProfile } from "@/lib/authApi";

import styles from "./page.module.css";

export default function ProfilePage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [saving, setSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPw, setChangingPw] = useState(false);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile({ name, email, phone: phone || undefined });
      showToast("Profile updated successfully", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to update profile", "error");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast("New passwords don't match", "error");
      return;
    }
    setChangingPw(true);
    try {
      await changePassword({ current_password: currentPassword, new_password: newPassword });
      showToast("Password changed successfully", "success");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to change password", "error");
    } finally {
      setChangingPw(false);
    }
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>My Profile</h1>

      <div className={styles.layout}>
        {/* Sidebar tabs */}
        <div className={styles.tabs}>
          <a href="#profile" className={`${styles.tab} ${styles.active}`}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M12.5 14v-1.5a3 3 0 00-3-3h-3a3 3 0 00-3 3V14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="8" cy="4.5" r="2.5" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            Edit Profile
          </a>
          <a href="#password" className={styles.tab}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M5.5 7V5a2.5 2.5 0 015 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Password & Security
          </a>
        </div>

        {/* Main content */}
        <div className={styles.content}>
          {/* Edit Profile section */}
          <section id="profile" className={styles.section}>
            <h2 className={styles.sectionTitle}>Edit Profile</h2>

            {/* Avatar */}
            <div className={styles.avatarSection}>
              <div className={styles.avatar}>
                {user?.name?.charAt(0)?.toUpperCase() || "?"}
              </div>
              <div className={styles.avatarInfo}>
                <span className={styles.avatarName}>{user?.name}</span>
                <span className={styles.avatarEmail}>{user?.email}</span>
              </div>
            </div>

            <form onSubmit={handleProfileSave} className={styles.form}>
              <div className={styles.row}>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="name">Full Name</label>
                  <input
                    id="name"
                    type="text"
                    className={styles.input}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  className={styles.input}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="phone">Phone Number</label>
                <input
                  id="phone"
                  type="tel"
                  className={styles.input}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter your phone number"
                />
              </div>

              <button type="submit" className={styles.saveBtn} disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </section>

          {/* Password section */}
          <section id="password" className={styles.section}>
            <h2 className={styles.sectionTitle}>Password & Security</h2>

            <form onSubmit={handlePasswordChange} className={styles.form}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="currentPw">Current Password</label>
                <input
                  id="currentPw"
                  type="password"
                  className={styles.input}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  required
                />
              </div>

              <div className={styles.row}>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="newPw">New Password</label>
                  <input
                    id="newPw"
                    type="password"
                    className={styles.input}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    required
                    minLength={6}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="confirmPw">Confirm New Password</label>
                  <input
                    id="confirmPw"
                    type="password"
                    className={styles.input}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <button type="submit" className={styles.saveBtn} disabled={changingPw}>
                {changingPw ? "Changing..." : "Change Password"}
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
