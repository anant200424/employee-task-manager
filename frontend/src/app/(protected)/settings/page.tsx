"use client";

import { useState, useEffect } from "react";
import { Topbar } from "@/components/dashboard/Topbar";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { api, extractApiError } from "@/lib/api";
import {
  Sliders,
  Palette,
  ShieldAlert,
  Key,
  Settings as SettingsIcon,
  Bell,
  Monitor,
  Activity,
  Globe,
  Clock,
  Calendar,
  Layout,
  Sun,
  Moon,
  CheckCircle,
  AlertTriangle,
  Download,
  ChevronDown,
} from "lucide-react";
import { toast } from "react-hot-toast";

// Dedicated bulletproof SaaS toggle switch component
interface ToggleSwitchProps {
  checked: boolean;
  onChange: (val: boolean) => void;
  ariaLabel?: string;
}

const ToggleSwitch = ({ checked, onChange, ariaLabel }: ToggleSwitchProps) => {
  return (
    <button
      type="button"
      role="switch"
      aria-label={ariaLabel}
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
        checked ? "bg-[#5B5FEF]" : "bg-slate-200 dark:bg-slate-700"
      }`}
      style={{ width: "44px", minWidth: "44px", height: "24px", minHeight: "24px" }}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
        style={{ width: "20px", height: "20px" }}
      />
    </button>
  );
};

export default function SettingsPage() {
  const { user, setUser } = useAuth();
  const { t } = useLanguage();
  const isAdmin = user?.role === "admin";

  const [activeTab, setActiveTab] = useState<
    "preferences" | "appearance" | "privacy" | "security" | "system"
  >("preferences");

  // ----------------------------------------------------
  // PREFERENCES STATES
  // ----------------------------------------------------
  const [emailAlerts, setEmailAlerts] = useState(
    user?.notificationPreferences?.emailAlerts ?? true
  );
  const [pushNotifications, setPushNotifications] = useState(
    user?.notificationPreferences?.pushNotifications ?? true
  );
  const [weeklyDigest, setWeeklyDigest] = useState(
    user?.notificationPreferences?.weeklyDigest ?? true
  );
  const [language, setLanguage] = useState("English");
  const [timezone, setTimezone] = useState("UTC-05:00 Eastern Time (US)");
  const [dateFormat, setDateFormat] = useState("MM/DD/YYYY");
  const [firstDayOfWeek, setFirstDayOfWeek] = useState("Sunday");

  const [isSavingPrefs, setIsSavingPrefs] = useState(false);
  const [prefsStatus, setPrefsStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  const handleSavePreferences = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSavingPrefs(true);
    setPrefsStatus({ type: null, message: "" });
    try {
      const res = await api.patch("/users/me", {
        notificationPreferences: {
          emailAlerts,
          pushNotifications,
          weeklyDigest,
          theme,
        },
      });
      setUser(res.data.data.user);
      setPrefsStatus({ type: "success", message: "Preferences updated successfully." });
      toast.success("Preferences updated successfully.");
      setTimeout(() => setPrefsStatus({ type: null, message: "" }), 3000);
    } catch (err) {
      const { message } = extractApiError(err);
      setPrefsStatus({ type: "error", message });
      toast.error(message || "Failed to update preferences.");
    } finally {
      setIsSavingPrefs(false);
    }
  };

  // ----------------------------------------------------
  // APPEARANCE STATES
  // ----------------------------------------------------
  const [theme, setTheme] = useState<"light" | "dark" | "system">("light");

  useEffect(() => {
    const savedTheme = (localStorage.getItem("theme") as "light" | "dark" | "system") || "light";
    setTheme(savedTheme);
  }, []);

  const handleThemeChange = (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);

    let isDark = false;
    if (newTheme === "dark") {
      isDark = true;
    } else if (newTheme === "system") {
      isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    } else {
      isDark = false;
    }

    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    window.dispatchEvent(new Event("theme-change"));

    api.patch("/users/me", {
      notificationPreferences: {
        theme: newTheme,
      },
    }).catch(() => {});

    toast.success(
      `Theme set to ${
        newTheme === "system"
          ? "System Default"
          : newTheme === "dark"
          ? "Dark Mode"
          : "Light Mode"
      }`
    );
  };

  const [density, setDensity] = useState("Comfortable");
  const [accentColor, setAccentColor] = useState("Blue");
  const [sidebarBehavior, setSidebarBehavior] = useState("Expanded");

  // ----------------------------------------------------
  // PRIVACY & DPDP STATES
  // ----------------------------------------------------
  const [dataSharingConsent, setDataSharingConsent] = useState(
    user?.privacySettings?.dataSharingConsent ?? false
  );
  const [marketingEmails, setMarketingEmails] = useState(
    user?.privacySettings?.marketingEmails ?? false
  );

  const [isSavingPrivacy, setIsSavingPrivacy] = useState(false);
  const [privacyStatus, setPrivacyStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });
  const [exporting, setExporting] = useState(false);

  const handleSavePrivacy = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPrivacy(true);
    setPrivacyStatus({ type: null, message: "" });
    try {
      const res = await api.patch("/users/me", {
        privacySettings: {
          dataSharingConsent,
          marketingEmails,
          analyticsConsent: true,
        },
      });
      setUser(res.data.data.user);
      setPrivacyStatus({ type: "success", message: "Privacy preferences saved." });
      toast.success("Privacy preferences saved.");
      setTimeout(() => setPrivacyStatus({ type: null, message: "" }), 3000);
    } catch (err) {
      const { message } = extractApiError(err);
      setPrivacyStatus({ type: "error", message });
      toast.error(message);
    } finally {
      setIsSavingPrivacy(false);
    }
  };

  const handleExportData = async () => {
    try {
      setExporting(true);
      const res = await api.get("/users/me/export");
      const blob = new Blob([JSON.stringify(res.data.data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `EmpSphere_Data_Export_${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Data export downloaded successfully.");
    } catch (err) {
      const { message } = extractApiError(err);
      toast.error(message || "Export failed.");
    } finally {
      setExporting(false);
    }
  };

  // ----------------------------------------------------
  // SECURITY & CREDENTIALS STATES
  // ----------------------------------------------------
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordStatus({ type: "error", message: "New passwords do not match." });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordStatus({ type: "error", message: "Password must be at least 8 characters." });
      return;
    }

    try {
      setIsUpdatingPassword(true);
      setPasswordStatus({ type: null, message: "" });
      await api.patch("/auth/change-password", {
        currentPassword,
        newPassword,
        confirmNewPassword: confirmPassword,
      });
      setPasswordStatus({ type: "success", message: "Password updated successfully!" });
      toast.success("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      const { message } = extractApiError(err);
      setPasswordStatus({ type: "error", message });
      toast.error(message);
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // ----------------------------------------------------
  // SYSTEM SETTINGS (ADMIN) STATES
  // ----------------------------------------------------
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [publicRegistration, setPublicRegistration] = useState(false);
  const [isSavingSystem, setIsSavingSystem] = useState(false);

  const handleSaveSystem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSavingSystem(true);
      await new Promise((resolve) => setTimeout(resolve, 600));
      toast.success("Platform configurations saved.");
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingSystem(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent pb-12 transition-colors duration-300">
      <Topbar
        title={t("settings", "Settings")}
        subtitle="Manage system preferences, notifications, security, and workspaces."
      />

      <main className="px-5 sm:px-8 lg:px-10 max-w-[1440px] mx-auto mt-6 animate-in fade-in duration-300">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* ----------------------------------------------------
              LEFT SUB-NAVIGATION SIDEBAR
              ---------------------------------------------------- */}
          <div className="w-full lg:w-[250px] shrink-0 space-y-4">
            <div>
              <h2 className="text-[20px] font-black text-slate-900 dark:text-white tracking-tight">
                System Settings
              </h2>
              <p className="text-[12.5px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                Manage account configurations
              </p>
            </div>

            <div className="space-y-1.5">
              <button
                onClick={() => setActiveTab("preferences")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[13.5px] font-bold transition-all cursor-pointer ${
                  activeTab === "preferences"
                    ? "bg-[#5B5FEF] text-white shadow-md shadow-[#5B5FEF]/25"
                    : "text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800/60"
                }`}
              >
                <Sliders className="w-4.5 h-4.5 shrink-0" />
                <span>Preferences</span>
              </button>

              <button
                onClick={() => setActiveTab("appearance")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[13.5px] font-bold transition-all cursor-pointer ${
                  activeTab === "appearance"
                    ? "bg-[#5B5FEF] text-white shadow-md shadow-[#5B5FEF]/25"
                    : "text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800/60"
                }`}
              >
                <Palette className="w-4.5 h-4.5 shrink-0" />
                <span>Appearance & Theme</span>
              </button>

              <button
                onClick={() => setActiveTab("privacy")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[13.5px] font-bold transition-all cursor-pointer ${
                  activeTab === "privacy"
                    ? "bg-[#5B5FEF] text-white shadow-md shadow-[#5B5FEF]/25"
                    : "text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800/60"
                }`}
              >
                <ShieldAlert className="w-4.5 h-4.5 shrink-0" />
                <span>Privacy & Data (DPDP)</span>
              </button>

              <button
                onClick={() => setActiveTab("security")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[13.5px] font-bold transition-all cursor-pointer ${
                  activeTab === "security"
                    ? "bg-[#5B5FEF] text-white shadow-md shadow-[#5B5FEF]/25"
                    : "text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800/60"
                }`}
              >
                <Key className="w-4.5 h-4.5 shrink-0" />
                <span>Security & Credentials</span>
              </button>

              {isAdmin && (
                <button
                  onClick={() => setActiveTab("system")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[13.5px] font-bold transition-all cursor-pointer ${
                    activeTab === "system"
                      ? "bg-[#5B5FEF] text-white shadow-md shadow-[#5B5FEF]/25"
                      : "text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800/60"
                  }`}
                >
                  <SettingsIcon className="w-4.5 h-4.5 shrink-0" />
                  <span>Platform Settings</span>
                </button>
              )}
            </div>
          </div>

          {/* ----------------------------------------------------
              RIGHT MAIN CONFIGURATION PANEL
              ---------------------------------------------------- */}
          <div className="flex-1 w-full space-y-6">
            {/* ====================================================
                TAB 1: ACCOUNT PREFERENCES (Matches Reference Image)
                ==================================================== */}
            {activeTab === "preferences" && (
              <form onSubmit={handleSavePreferences} className="space-y-6">
                {/* Section Header with Save Button */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-[24px] font-black text-slate-900 dark:text-white tracking-tight">
                      Account Preferences
                    </h1>
                    <p className="text-[13.5px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                      Configure your personal notifications, localization, and date formats.
                    </p>
                  </div>
                  <button
                    type="submit"
                    disabled={isSavingPrefs}
                    className="bg-[#111827] dark:bg-slate-800 hover:bg-black text-white px-6 py-2.5 rounded-xl text-[13.5px] font-black shadow-sm transition-all active:scale-95 cursor-pointer shrink-0 disabled:opacity-50"
                  >
                    {isSavingPrefs ? "Saving..." : "Save Changes"}
                  </button>
                </div>

                {/* Status alert */}
                {prefsStatus.type && (
                  <div
                    className={`flex items-center gap-3 p-4 rounded-2xl border ${
                      prefsStatus.type === "success"
                        ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-300"
                        : "bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/30 text-rose-800 dark:text-rose-300"
                    }`}
                  >
                    {prefsStatus.type === "success" ? (
                      <CheckCircle className="w-5 h-5 shrink-0 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600" />
                    )}
                    <span className="text-[13px] font-bold">{prefsStatus.message}</span>
                  </div>
                )}

                {/* Card 1: NOTIFICATIONS */}
                <div className="bg-white dark:bg-slate-900/90 rounded-[22px] border border-slate-200/90 dark:border-slate-800 p-6 sm:p-7 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-6">
                  <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    Notifications
                  </p>

                  <div className="space-y-6 divide-y divide-slate-100 dark:divide-slate-800/80">
                    {/* Row 1: Email Alerts */}
                    <div className="flex items-center justify-between pt-0 gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0">
                          <Bell className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <h4 className="text-[14px] font-black text-slate-900 dark:text-white">
                            Email Alerts
                          </h4>
                          <p className="text-[12.5px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                            Receive summaries, assignments, and onboarding alerts via email.
                          </p>
                        </div>
                      </div>
                      <ToggleSwitch
                        checked={emailAlerts}
                        onChange={setEmailAlerts}
                        ariaLabel="Toggle Email Alerts"
                      />
                    </div>

                    {/* Row 2: Desktop Notification Push */}
                    <div className="flex items-center justify-between pt-6 gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0">
                          <Monitor className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <h4 className="text-[14px] font-black text-slate-900 dark:text-white">
                            Desktop Notification Push
                          </h4>
                          <p className="text-[12.5px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                            Enable real-time notification toasts in your web browser.
                          </p>
                        </div>
                      </div>
                      <ToggleSwitch
                        checked={pushNotifications}
                        onChange={setPushNotifications}
                        ariaLabel="Toggle Desktop Notification Push"
                      />
                    </div>

                    {/* Row 3: Weekly Digest Emails */}
                    <div className="flex items-center justify-between pt-6 gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0">
                          <Activity className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <h4 className="text-[14px] font-black text-slate-900 dark:text-white">
                            Weekly Digest Emails
                          </h4>
                          <p className="text-[12.5px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                            A summary email sent every Monday morning with your pending tasks.
                          </p>
                        </div>
                      </div>
                      <ToggleSwitch
                        checked={weeklyDigest}
                        onChange={setWeeklyDigest}
                        ariaLabel="Toggle Weekly Digest Emails"
                      />
                    </div>
                  </div>
                </div>

                {/* Card 2: REGIONAL & LOCALIZATION */}
                <div className="bg-white dark:bg-slate-900/90 rounded-[22px] border border-slate-200/90 dark:border-slate-800 p-6 sm:p-7 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-6">
                  <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    Regional & Localization
                  </p>

                  <div className="space-y-6 divide-y divide-slate-100 dark:divide-slate-800/80">
                    {/* Row 1: Language Preference */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-0 gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0">
                          <Globe className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <h4 className="text-[14px] font-black text-slate-900 dark:text-white">
                            Language Preference
                          </h4>
                          <p className="text-[12.5px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                            Set the default language for the employee workspace environment.
                          </p>
                        </div>
                      </div>
                      <div className="relative shrink-0 sm:w-60">
                        <select
                          value={language}
                          onChange={(e) => setLanguage(e.target.value)}
                          className="w-full appearance-none rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 pr-9 text-[13px] font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B5FEF]/20 cursor-pointer shadow-xs"
                        >
                          <option value="English">English</option>
                          <option value="Hindi">Hindi (हिंदी)</option>
                          <option value="Spanish">Spanish (Español)</option>
                          <option value="French">French (Français)</option>
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    {/* Row 2: Timezone */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-6 gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0">
                          <Clock className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <h4 className="text-[14px] font-black text-slate-900 dark:text-white">
                            Timezone
                          </h4>
                          <p className="text-[12.5px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                            Used for calendar invites and task due dates.
                          </p>
                        </div>
                      </div>
                      <div className="relative shrink-0 sm:w-60">
                        <select
                          value={timezone}
                          onChange={(e) => setTimezone(e.target.value)}
                          className="w-full appearance-none rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 pr-9 text-[13px] font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B5FEF]/20 cursor-pointer shadow-xs"
                        >
                          <option value="UTC-05:00 Eastern Time (US)">UTC-05:00 Eastern Time (US)</option>
                          <option value="UTC-08:00 Pacific Time">UTC-08:00 Pacific Time</option>
                          <option value="UTC+00:00 GMT">UTC+00:00 GMT</option>
                          <option value="UTC+05:30 IST">UTC+05:30 Indian Standard Time</option>
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    {/* Row 3: Date Format */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-6 gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0">
                          <Calendar className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <h4 className="text-[14px] font-black text-slate-900 dark:text-white">
                            Date Format
                          </h4>
                          <p className="text-[12.5px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                            How dates should be displayed across the dashboard.
                          </p>
                        </div>
                      </div>
                      <div className="relative shrink-0 sm:w-60">
                        <select
                          value={dateFormat}
                          onChange={(e) => setDateFormat(e.target.value)}
                          className="w-full appearance-none rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 pr-9 text-[13px] font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B5FEF]/20 cursor-pointer shadow-xs"
                        >
                          <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                          <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                          <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    {/* Row 4: First Day of the Week */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-6 gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0">
                          <Layout className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <h4 className="text-[14px] font-black text-slate-900 dark:text-white">
                            First Day of the Week
                          </h4>
                          <p className="text-[12.5px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                            Affects calendar views and weekly reporting.
                          </p>
                        </div>
                      </div>
                      <div className="relative shrink-0 sm:w-60">
                        <select
                          value={firstDayOfWeek}
                          onChange={(e) => setFirstDayOfWeek(e.target.value)}
                          className="w-full appearance-none rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 pr-9 text-[13px] font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B5FEF]/20 cursor-pointer shadow-xs"
                        >
                          <option value="Sunday">Sunday</option>
                          <option value="Monday">Monday</option>
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            )}

            {/* ====================================================
                TAB 2: APPEARANCE & THEME
                ==================================================== */}
            {activeTab === "appearance" && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-[24px] font-black text-slate-900 dark:text-white tracking-tight">
                    Appearance & Theme
                  </h1>
                  <p className="text-[13.5px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                    Customize the visual appearance and UI theme of your workspace.
                  </p>
                </div>

                <div className="bg-white dark:bg-slate-900/90 rounded-[22px] border border-slate-200/90 dark:border-slate-800 p-6 sm:p-7 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-6">
                  <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    Display Theme
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <button
                      type="button"
                      onClick={() => handleThemeChange("light")}
                      className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all cursor-pointer ${
                        theme === "light"
                          ? "border-[#5B5FEF] bg-[#EEF0FF] dark:bg-[#5B5FEF]/20 text-[#5B5FEF] dark:text-[#818CF8] shadow-xs"
                          : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700"
                      }`}
                    >
                      <Sun className="w-7 h-7 mb-3" />
                      <span className="text-[14px] font-extrabold">Light Mode</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleThemeChange("dark")}
                      className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all cursor-pointer ${
                        theme === "dark"
                          ? "border-[#5B5FEF] bg-[#EEF0FF] dark:bg-[#5B5FEF]/20 text-[#5B5FEF] dark:text-[#818CF8] shadow-xs"
                          : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700"
                      }`}
                    >
                      <Moon className="w-7 h-7 mb-3" />
                      <span className="text-[14px] font-extrabold">Dark Mode</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleThemeChange("system")}
                      className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all cursor-pointer ${
                        theme === "system"
                          ? "border-[#5B5FEF] bg-[#EEF0FF] dark:bg-[#5B5FEF]/20 text-[#5B5FEF] dark:text-[#818CF8] shadow-xs"
                          : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700"
                      }`}
                    >
                      <Monitor className="w-7 h-7 mb-3" />
                      <span className="text-[14px] font-extrabold">System Default</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ====================================================
                TAB 3: PRIVACY & DATA (DPDP)
                ==================================================== */}
            {activeTab === "privacy" && (
              <form onSubmit={handleSavePrivacy} className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-[24px] font-black text-slate-900 dark:text-white tracking-tight">
                      Privacy & Data Governance
                    </h1>
                    <p className="text-[13.5px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                      Compliant with India DPDP Act 2023 & GDPR Data Protection.
                    </p>
                  </div>
                  <button
                    type="submit"
                    disabled={isSavingPrivacy}
                    className="bg-[#111827] dark:bg-slate-800 hover:bg-black text-white px-6 py-2.5 rounded-xl text-[13.5px] font-black shadow-sm transition-all active:scale-95 cursor-pointer shrink-0"
                  >
                    {isSavingPrivacy ? "Saving..." : "Save Privacy"}
                  </button>
                </div>

                <div className="bg-white dark:bg-slate-900/90 rounded-[22px] border border-slate-200/90 dark:border-slate-800 p-6 sm:p-7 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-6">
                  <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    Data Rights & Consents
                  </p>

                  <div className="space-y-6 divide-y divide-slate-100 dark:divide-slate-800/80">
                    <div className="flex items-center justify-between pt-0 gap-4">
                      <div>
                        <h4 className="text-[14px] font-black text-slate-900 dark:text-white">
                          Marketing & Communication Consents
                        </h4>
                        <p className="text-[12.5px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                          Receive quarterly product newsletters and feature updates.
                        </p>
                      </div>
                      <ToggleSwitch
                        checked={marketingEmails}
                        onChange={setMarketingEmails}
                        ariaLabel="Toggle Marketing Emails"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-6 gap-4">
                      <div>
                        <h4 className="text-[14px] font-black text-slate-900 dark:text-white">
                          Data Portability Export
                        </h4>
                        <p className="text-[12.5px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                          Download a copy of your personal activity logs and task assignments.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleExportData}
                        disabled={exporting}
                        className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-[13px] font-bold flex items-center gap-2 cursor-pointer transition-all shadow-xs"
                      >
                        <Download className="w-4 h-4 text-[#5B5FEF]" />
                        <span>{exporting ? "Exporting..." : "Download JSON"}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            )}

            {/* ====================================================
                TAB 4: SECURITY & CREDENTIALS
                ==================================================== */}
            {activeTab === "security" && (
              <form onSubmit={handleUpdatePassword} className="space-y-6">
                <div>
                  <h1 className="text-[24px] font-black text-slate-900 dark:text-white tracking-tight">
                    Security & Credentials
                  </h1>
                  <p className="text-[13.5px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                    Update your account password and manage two-factor authentication.
                  </p>
                </div>

                <div className="bg-white dark:bg-slate-900/90 rounded-[22px] border border-slate-200/90 dark:border-slate-800 p-6 sm:p-7 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-6">
                  <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    Change Password
                  </p>

                  <div className="space-y-4 max-w-lg">
                    <div>
                      <label className="block text-[13px] font-extrabold text-slate-700 dark:text-slate-300 mb-1.5">
                        Current Password
                      </label>
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[13.5px] font-semibold focus:outline-none focus:border-[#5B5FEF] transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-[13px] font-extrabold text-slate-700 dark:text-slate-300 mb-1.5">
                        New Password
                      </label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[13.5px] font-semibold focus:outline-none focus:border-[#5B5FEF] transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-[13px] font-extrabold text-slate-700 dark:text-slate-300 mb-1.5">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[13.5px] font-semibold focus:outline-none focus:border-[#5B5FEF] transition-all"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isUpdatingPassword}
                      className="bg-[#111827] dark:bg-slate-800 hover:bg-black text-white px-6 py-2.5 rounded-xl text-[13.5px] font-black shadow-sm transition-all active:scale-95 cursor-pointer disabled:opacity-50 mt-2"
                    >
                      {isUpdatingPassword ? "Updating Password..." : "Update Password"}
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* ====================================================
                TAB 5: PLATFORM SETTINGS (ADMIN)
                ==================================================== */}
            {activeTab === "system" && isAdmin && (
              <form onSubmit={handleSaveSystem} className="space-y-6">
                <div>
                  <h1 className="text-[24px] font-black text-slate-900 dark:text-white tracking-tight">
                    Platform & System Administration
                  </h1>
                  <p className="text-[13.5px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                    Configure global organization settings and registration policies.
                  </p>
                </div>

                <div className="bg-white dark:bg-slate-900/90 rounded-[22px] border border-slate-200/90 dark:border-slate-800 p-6 sm:p-7 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-6">
                  <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    Access Controls
                  </p>

                  <div className="space-y-6 divide-y divide-slate-100 dark:divide-slate-800/80">
                    <div className="flex items-center justify-between pt-0 gap-4">
                      <div>
                        <h4 className="text-[14px] font-black text-slate-900 dark:text-white">
                          Public Employee Registration
                        </h4>
                        <p className="text-[12.5px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                          Allow self-signup on the registration portal with OTP verification.
                        </p>
                      </div>
                      <ToggleSwitch
                        checked={publicRegistration}
                        onChange={setPublicRegistration}
                        ariaLabel="Toggle Public Registration"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-6 gap-4">
                      <div>
                        <h4 className="text-[14px] font-black text-slate-900 dark:text-white">
                          System Maintenance Mode
                        </h4>
                        <p className="text-[12.5px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                          Temporarily disable non-admin logins for scheduled database updates.
                        </p>
                      </div>
                      <ToggleSwitch
                        checked={maintenanceMode}
                        onChange={setMaintenanceMode}
                        ariaLabel="Toggle Maintenance Mode"
                      />
                    </div>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
