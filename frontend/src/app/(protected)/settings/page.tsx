"use client";

import { useState, useEffect, useMemo } from "react";
import { Topbar } from "@/components/dashboard/Topbar";
import { useAuth } from "@/context/AuthContext";
import { useLanguage, LanguageCode } from "@/context/LanguageContext";
import { api, extractApiError } from "@/lib/api";
import { isSystemAdminUser } from "@/lib/roleUtils";
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
  Eye,
  EyeOff,
  ShieldCheck,
  Laptop,
  LogOut,
  Check,
  Layers,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { toast } from "react-hot-toast";

// Dedicated bulletproof SaaS toggle switch component
interface ToggleSwitchProps {
  checked: boolean;
  onChange: (_val: boolean) => void;
  ariaLabel?: string;
  disabled?: boolean;
}

const ToggleSwitch = ({ checked, onChange, ariaLabel, disabled }: ToggleSwitchProps) => {
  return (
    <button
      type="button"
      role="switch"
      aria-label={ariaLabel}
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
      } ${
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
  const { t, language: appLang, setLanguage: setAppLang } = useLanguage();

  const rawRole = String(user?.role || "").toLowerCase();
  const sysRole =
    user?.systemRole ||
    (rawRole === "admin"
      ? "admin"
      : rawRole.includes("super")
      ? "super_admin"
      : rawRole.includes("system")
      ? "system_admin"
      : rawRole.includes("manager")
      ? "manager"
      : "employee");

  // Platform and infrastructure system settings are governed by Super Admin and System Admin
  const isAdmin = isSystemAdminUser(user);

  const [activeTab, setActiveTab] = useState<
    "preferences" | "appearance" | "privacy" | "security" | "system"
  >("preferences");

  // ----------------------------------------------------
  // 1. PREFERENCES STATES
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

  const [language, setLanguage] = useState(
    user?.regionalPreferences?.language || (appLang === "hi" ? "Hindi" : appLang === "es" ? "Spanish" : appLang === "fr" ? "French" : "English")
  );
  const [timezone, setTimezone] = useState(
    user?.regionalPreferences?.timezone || "UTC-05:00 Eastern Time (US)"
  );
  const [dateFormat, setDateFormat] = useState(
    user?.regionalPreferences?.dateFormat || "MM/DD/YYYY"
  );
  const [firstDayOfWeek, setFirstDayOfWeek] = useState(
    user?.regionalPreferences?.firstDayOfWeek || "Sunday"
  );

  const [isSavingPrefs, setIsSavingPrefs] = useState(false);
  const [prefsStatus, setPrefsStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  const handleLanguageSelect = (val: string) => {
    setLanguage(val);
    const langMap: Record<string, LanguageCode> = {
      English: "en",
      Hindi: "hi",
      Spanish: "es",
      French: "fr",
    };
    const code = langMap[val] || "en";
    setAppLang(code);
  };

  const handleSavePreferences = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSavingPrefs(true);
    setPrefsStatus({ type: null, message: "" });
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("dateFormat", dateFormat);
        localStorage.setItem("timezone", timezone);
        localStorage.setItem("firstDayOfWeek", firstDayOfWeek);
        window.dispatchEvent(new Event("regional-preferences-change"));
      }

      const res = await api.patch("/users/me", {
        notificationPreferences: {
          emailAlerts,
          pushNotifications,
          weeklyDigest,
          theme,
        },
        regionalPreferences: {
          language,
          timezone,
          dateFormat,
          firstDayOfWeek,
        },
      });
      if (res.data?.data?.user) setUser(res.data.data.user);
      setPrefsStatus({ type: "success", message: "Preferences updated and saved to your profile." });
      toast.success("Preferences updated successfully.", { id: "settings-prefs-toast" });
      setTimeout(() => setPrefsStatus({ type: null, message: "" }), 3500);
    } catch (err) {
      const { message } = extractApiError(err);
      setPrefsStatus({ type: "error", message });
      toast.error(message || "Failed to update preferences.", { id: "settings-prefs-toast" });
    } finally {
      setIsSavingPrefs(false);
    }
  };

  // ----------------------------------------------------
  // 2. APPEARANCE & THEME STATES
  // ----------------------------------------------------
  const [theme, setTheme] = useState<"light" | "dark" | "system">("light");
  const [density, setDensity] = useState<"Comfortable" | "Compact">(
    (user?.appearancePreferences?.density as "Comfortable" | "Compact") || "Comfortable"
  );
  const [accentColor, setAccentColor] = useState<string>(
    user?.appearancePreferences?.accentColor || "Indigo"
  );
  const [sidebarBehavior, setSidebarBehavior] = useState<string>(
    user?.appearancePreferences?.sidebarBehavior || "Expanded"
  );

  useEffect(() => {
    const savedTheme = (localStorage.getItem("theme") as "light" | "dark" | "system") || "light";
    setTheme(savedTheme);

    const savedDensity = (localStorage.getItem("density") as "Comfortable" | "Compact") || "Comfortable";
    setDensity(savedDensity);
    document.documentElement.setAttribute("data-density", savedDensity.toLowerCase());

    const savedAccent = localStorage.getItem("accentColor") || "Indigo";
    setAccentColor(savedAccent);
    document.documentElement.setAttribute("data-accent", savedAccent.toLowerCase().replace(/\s+/g, "-"));

    const savedBehavior = localStorage.getItem("sidebarBehavior") || "Expanded";
    setSidebarBehavior(savedBehavior);
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
        emailAlerts,
        pushNotifications,
        weeklyDigest,
        theme: newTheme,
      },
    }).then((res) => {
      if (res.data?.data?.user) setUser(res.data.data.user);
    }).catch(() => {});

    toast.success(
      `Theme set to ${
        newTheme === "system"
          ? "System Default"
          : newTheme === "dark"
          ? "Dark Mode"
          : "Light Mode"
      }`,
      { id: "settings-appearance-toast" }
    );
  };

  const handleDensityChange = (newDensity: "Comfortable" | "Compact") => {
    setDensity(newDensity);
    localStorage.setItem("density", newDensity);
    document.documentElement.setAttribute("data-density", newDensity.toLowerCase());
    window.dispatchEvent(new CustomEvent("density-change", { detail: newDensity }));

    api.patch("/users/me", {
      appearancePreferences: {
        density: newDensity,
        accentColor,
        sidebarBehavior,
      },
    }).then((res) => {
      if (res.data?.data?.user) setUser(res.data.data.user);
    }).catch(() => {});

    toast.success(`Interface layout set to ${newDensity}`, { id: "settings-appearance-toast" });
  };

  const handleAccentChange = (newAccent: string) => {
    setAccentColor(newAccent);
    localStorage.setItem("accentColor", newAccent);
    const key = newAccent.toLowerCase().replace(/\s+/g, "-");
    document.documentElement.setAttribute("data-accent", key);
    window.dispatchEvent(new CustomEvent("accent-color-change", { detail: newAccent }));

    api.patch("/users/me", {
      appearancePreferences: {
        density,
        accentColor: newAccent,
        sidebarBehavior,
      },
    }).then((res) => {
      if (res.data?.data?.user) setUser(res.data.data.user);
    }).catch(() => {});

    toast.success(`Theme accent set to ${newAccent}`, { id: "settings-appearance-toast" });
  };

  const handleSidebarBehaviorChange = (newBehavior: string) => {
    setSidebarBehavior(newBehavior);
    localStorage.setItem("sidebarBehavior", newBehavior);
    localStorage.setItem("sidebar_collapsed", String(newBehavior === "Collapsed"));
    window.dispatchEvent(new Event("sidebar-behavior-change"));

    api.patch("/users/me", {
      appearancePreferences: {
        density,
        accentColor,
        sidebarBehavior: newBehavior,
      },
    }).then((res) => {
      if (res.data?.data?.user) setUser(res.data.data.user);
    }).catch(() => {});

    toast.success(`Sidebar default behavior set to ${newBehavior}`, { id: "settings-appearance-toast" });
  };

  // ----------------------------------------------------
  // 3. PRIVACY & DPDP STATES
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
        },
      });
      if (res.data?.data?.user) setUser(res.data.data.user);
      setPrivacyStatus({ type: "success", message: "Privacy & consent preferences updated successfully." });
      toast.success("Privacy preferences saved.", { id: "settings-privacy-toast" });
      setTimeout(() => setPrivacyStatus({ type: null, message: "" }), 3500);
    } catch (err) {
      const { message } = extractApiError(err);
      setPrivacyStatus({ type: "error", message });
      toast.error(message || "Failed to update privacy settings.", { id: "settings-privacy-toast" });
    } finally {
      setIsSavingPrivacy(false);
    }
  };

  const handleExportData = async () => {
    try {
      setExporting(true);
      let exportData: any = null;
      try {
        const res = await api.get("/users/me/export");
        exportData = res.data?.data || res.data;
      } catch {
        exportData = {
          userProfile: user,
          regionalPreferences: { language, timezone, dateFormat, firstDayOfWeek },
          appearancePreferences: { theme, density, accentColor, sidebarBehavior },
          privacyConsents: { dataSharingConsent, marketingEmails },
          exportedAt: new Date().toISOString(),
          compliance: "India DPDP Act 2023 / GDPR Export",
        };
      }
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
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
      toast.success("Data export downloaded successfully.", { id: "settings-export-toast" });
    } catch (err) {
      const { message } = extractApiError(err);
      toast.error(message || "Export failed.", { id: "settings-export-toast" });
    } finally {
      setExporting(false);
    }
  };

  // ----------------------------------------------------
  // 4. SECURITY & CREDENTIALS STATES
  // ----------------------------------------------------
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(
    user?.twoFactorEnabled ?? false
  );
  const [isSaving2FA, setIsSaving2FA] = useState(false);
  const [terminatingSessions, setTerminatingSessions] = useState(false);

  // Live password validation
  const pwRules = useMemo(() => {
    return {
      minLen: newPassword.length >= 8,
      hasUpper: /[A-Z]/.test(newPassword),
      hasLower: /[a-z]/.test(newPassword),
      hasNumber: /[0-9]/.test(newPassword),
      hasSpecial: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newPassword),
    };
  }, [newPassword]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      setPasswordStatus({ type: "error", message: "Current password is required." });
      toast.error("Please enter your current password.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordStatus({ type: "error", message: "New passwords do not match." });
      toast.error("New passwords do not match.");
      return;
    }
    if (!pwRules.minLen || !pwRules.hasUpper || !pwRules.hasLower || !pwRules.hasNumber || !pwRules.hasSpecial) {
      setPasswordStatus({
        type: "error",
        message: "New password must meet all security requirements.",
      });
      toast.error("Please satisfy all password complexity rules.");
      return;
    }

    try {
      setIsUpdatingPassword(true);
      setPasswordStatus({ type: null, message: "" });
      await api.patch("/auth/change-password", {
        currentPassword,
        newPassword,
        confirmPassword,
      });
      setPasswordStatus({
        type: "success",
        message: "Password updated successfully! Next session will require your new credentials.",
      });
      toast.success("Password changed successfully!");
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

  const handleToggle2FA = async (val: boolean) => {
    try {
      setIsSaving2FA(true);
      const res = await api.patch("/users/me", {
        twoFactorEnabled: val,
      });
      setUser(res.data.data.user);
      setTwoFactorEnabled(val);
      toast.success(val ? "Two-Factor Authentication activated." : "Two-Factor Authentication disabled.", { id: "settings-2fa-toast" });
    } catch (err) {
      const { message } = extractApiError(err);
      toast.error(message || "Failed to update 2FA setting.", { id: "settings-2fa-toast" });
    } finally {
      setIsSaving2FA(false);
    }
  };

  const handleTerminateOtherSessions = async () => {
    try {
      setTerminatingSessions(true);
      await api.post("/auth/terminate-other-sessions");
      toast.success("All other device sessions have been terminated.", { id: "settings-session-toast" });
    } catch (err) {
      const { message } = extractApiError(err);
      toast.error(message || "Failed to terminate other sessions.", { id: "settings-session-toast" });
    } finally {
      setTerminatingSessions(false);
    }
  };

  // ----------------------------------------------------
  // 5. SYSTEM SETTINGS (ADMIN ONLY) STATES
  // ----------------------------------------------------
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [publicRegistration, setPublicRegistration] = useState(true);
  const [sessionTimeoutMinutes, setSessionTimeoutMinutes] = useState(60);
  const [maxLoginAttempts, setMaxLoginAttempts] = useState(5);
  const [adminActionNotification, setAdminActionNotification] = useState("both");
  const [isSavingSystem, setIsSavingSystem] = useState(false);
  const [loadingSystemSettings, setLoadingSystemSettings] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      setLoadingSystemSettings(true);
      api
        .get("/users/system/settings")
        .then((res) => {
          const s = res.data?.data?.settings;
          if (s) {
            setPublicRegistration(s.publicRegistration ?? true);
            setMaintenanceMode(s.maintenanceMode ?? false);
            setSessionTimeoutMinutes(s.sessionTimeoutMinutes ?? 60);
            setMaxLoginAttempts(s.maxLoginAttempts ?? 5);
            setAdminActionNotification(s.adminActionNotification ?? "both");
          }
        })
        .catch(() => {})
        .finally(() => setLoadingSystemSettings(false));
    }
  }, [isAdmin]);

  const handleSaveSystem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSavingSystem(true);
      await api.patch("/users/system/settings", {
        publicRegistration,
        maintenanceMode,
        sessionTimeoutMinutes,
        maxLoginAttempts,
        adminActionNotification,
      });
      toast.success("Platform configurations updated successfully.", { id: "settings-system-toast" });
    } catch (err) {
      const { message } = extractApiError(err);
      toast.error(message || "Failed to save platform configurations.", { id: "settings-system-toast" });
    } finally {
      setIsSavingSystem(false);
    }
  };

  const accents = [
    { name: "Indigo", hex: "#5B5FEF", class: "bg-[#5B5FEF]" },
    { name: "Sky Blue", hex: "#0EA5E9", class: "bg-sky-500" },
    { name: "Emerald", hex: "#10B981", class: "bg-emerald-500" },
    { name: "Purple", hex: "#8B5CF6", class: "bg-purple-500" },
    { name: "Rose", hex: "#F43F5E", class: "bg-rose-500" },
  ];

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
                type="button"
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
                type="button"
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
                type="button"
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
                type="button"
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
                  type="button"
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
                TAB 1: ACCOUNT PREFERENCES
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
                    className={`flex items-center gap-3 p-4 rounded-2xl border animate-in fade-in duration-200 ${
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
                        onChange={(val) => {
                          setPushNotifications(val);
                          if (val && typeof window !== "undefined" && "Notification" in window && Notification.permission !== "granted") {
                            Notification.requestPermission();
                          }
                        }}
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
                      <div className="relative shrink-0 sm:w-64">
                        <select
                          value={language}
                          onChange={(e) => handleLanguageSelect(e.target.value)}
                          className="w-full appearance-none rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 pr-9 text-[13px] font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B5FEF]/20 cursor-pointer shadow-xs"
                        >
                          <option value="English">🇬🇧 English (Default)</option>
                          <option value="Hindi">🇮🇳 Hindi (हिन्दी)</option>
                          <option value="Spanish">🇪🇸 Spanish (Español)</option>
                          <option value="French">🇫🇷 French (Français)</option>
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
                      <div className="relative shrink-0 sm:w-64">
                        <select
                          value={timezone}
                          onChange={(e) => setTimezone(e.target.value)}
                          className="w-full appearance-none rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 pr-9 text-[13px] font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B5FEF]/20 cursor-pointer shadow-xs"
                        >
                          <option value="UTC-05:00 Eastern Time (US)">UTC-05:00 Eastern Time (US)</option>
                          <option value="UTC-08:00 Pacific Time">UTC-08:00 Pacific Time</option>
                          <option value="UTC+00:00 GMT">UTC+00:00 GMT</option>
                          <option value="UTC+05:30 IST">UTC+05:30 Indian Standard Time</option>
                          <option value="UTC+01:00 Central European">UTC+01:00 Central European</option>
                          <option value="UTC+08:00 Singapore Time">UTC+08:00 Singapore Time</option>
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
                      <div className="relative shrink-0 sm:w-64">
                        <select
                          value={dateFormat}
                          onChange={(e) => setDateFormat(e.target.value)}
                          className="w-full appearance-none rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 pr-9 text-[13px] font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B5FEF]/20 cursor-pointer shadow-xs"
                        >
                          <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 09/03/2026)</option>
                          <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 03/09/2026)</option>
                          <option value="YYYY-MM-DD">YYYY-MM-DD (e.g. 2026-09-03)</option>
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
                      <div className="relative shrink-0 sm:w-64">
                        <select
                          value={firstDayOfWeek}
                          onChange={(e) => setFirstDayOfWeek(e.target.value)}
                          className="w-full appearance-none rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 pr-9 text-[13px] font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B5FEF]/20 cursor-pointer shadow-xs"
                        >
                          <option value="Sunday">Sunday (Default)</option>
                          <option value="Monday">Monday</option>
                          <option value="Saturday">Saturday</option>
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
                    Customize the visual appearance, interface scaling, and branding of your workspace.
                  </p>
                </div>

                {/* Card 1: Display Theme */}
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
                      <span className="text-[12px] font-medium text-slate-400 mt-1">Clean crisp white</span>
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
                      <span className="text-[12px] font-medium text-slate-400 mt-1">High contrast slate</span>
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
                      <span className="text-[12px] font-medium text-slate-400 mt-1">Matches OS preference</span>
                    </button>
                  </div>
                </div>

                {/* Card 2: Interface Density & Spacing */}
                <div className="bg-white dark:bg-slate-900/90 rounded-[22px] border border-slate-200/90 dark:border-slate-800 p-6 sm:p-7 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-6">
                  <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    Interface Density
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => handleDensityChange("Comfortable")}
                      className={`flex items-start gap-4 p-5 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                        density === "Comfortable"
                          ? "border-[#5B5FEF] bg-[#EEF0FF]/60 dark:bg-[#5B5FEF]/15"
                          : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/40 text-[#5B5FEF] flex items-center justify-center shrink-0">
                        <Layers className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-[14px] font-black text-slate-900 dark:text-white">
                            Comfortable (Default)
                          </h4>
                          {density === "Comfortable" && <Check className="w-4 h-4 text-[#5B5FEF]" />}
                        </div>
                        <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400 mt-1">
                          Standard row heights, balanced padding, and optimal whitespace readability.
                        </p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDensityChange("Compact")}
                      className={`flex items-start gap-4 p-5 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                        density === "Compact"
                          ? "border-[#5B5FEF] bg-[#EEF0FF]/60 dark:bg-[#5B5FEF]/15"
                          : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center shrink-0">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-[14px] font-black text-slate-900 dark:text-white">
                            Compact
                          </h4>
                          {density === "Compact" && <Check className="w-4 h-4 text-[#5B5FEF]" />}
                        </div>
                        <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400 mt-1">
                          Dense data grids, compact padding, and higher information density per screen.
                        </p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Card 3: Theme Accent Color */}
                <div className="bg-white dark:bg-slate-900/90 rounded-[22px] border border-slate-200/90 dark:border-slate-800 p-6 sm:p-7 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-6">
                  <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    Accent Color
                  </p>

                  <div className="flex flex-wrap items-center gap-3">
                    {accents.map((acc) => {
                      const isSelected = accentColor === acc.name;
                      return (
                        <button
                          key={acc.name}
                          type="button"
                          onClick={() => handleAccentChange(acc.name)}
                          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border-2 transition-all cursor-pointer ${
                            isSelected
                              ? "border-slate-900 dark:border-white shadow-xs bg-slate-50 dark:bg-slate-800"
                              : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900"
                          }`}
                        >
                          <span className={`w-4 h-4 rounded-full ${acc.class} shrink-0 ring-2 ring-white dark:ring-slate-900`} />
                          <span className="text-[13px] font-bold text-slate-800 dark:text-slate-200">
                            {acc.name}
                          </span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-slate-900 dark:text-white shrink-0 ml-1" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Card 4: Sidebar Behavior */}
                <div className="bg-white dark:bg-slate-900/90 rounded-[22px] border border-slate-200/90 dark:border-slate-800 p-6 sm:p-7 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-6">
                  <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    Sidebar Behavior
                  </p>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h4 className="text-[14px] font-black text-slate-900 dark:text-white">
                        Default Sidebar View
                      </h4>
                      <p className="text-[12.5px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                        Choose whether the main navigation sidebar opens in full expanded mode or mini icon rail.
                      </p>
                    </div>
                    <div className="relative shrink-0 sm:w-60">
                      <select
                        value={sidebarBehavior}
                        onChange={(e) => handleSidebarBehaviorChange(e.target.value)}
                        className="w-full appearance-none rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 pr-9 text-[13px] font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B5FEF]/20 cursor-pointer shadow-xs"
                      >
                        <option value="Expanded">Expanded (Full Navigation)</option>
                        <option value="Collapsed">Collapsed (Icon Rail)</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
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
                    className="bg-[#111827] dark:bg-slate-800 hover:bg-black text-white px-6 py-2.5 rounded-xl text-[13.5px] font-black shadow-sm transition-all active:scale-95 cursor-pointer shrink-0 disabled:opacity-50"
                  >
                    {isSavingPrivacy ? "Saving..." : "Save Privacy"}
                  </button>
                </div>

                {privacyStatus.type && (
                  <div
                    className={`flex items-center gap-3 p-4 rounded-2xl border animate-in fade-in duration-200 ${
                      privacyStatus.type === "success"
                        ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-300"
                        : "bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/30 text-rose-800 dark:text-rose-300"
                    }`}
                  >
                    {privacyStatus.type === "success" ? (
                      <CheckCircle className="w-5 h-5 shrink-0 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600" />
                    )}
                    <span className="text-[13px] font-bold">{privacyStatus.message}</span>
                  </div>
                )}

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
                          Data Sharing & Analytics Consent
                        </h4>
                        <p className="text-[12.5px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                          Allow anonymized usage analytics to help optimize team workflow efficiency.
                        </p>
                      </div>
                      <ToggleSwitch
                        checked={dataSharingConsent}
                        onChange={setDataSharingConsent}
                        ariaLabel="Toggle Data Sharing Consent"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-6 gap-4">
                      <div>
                        <h4 className="text-[14px] font-black text-slate-900 dark:text-white">
                          Data Portability Export
                        </h4>
                        <p className="text-[12.5px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                          Download a complete archive of your personal profile, assigned tasks, and compliance records.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleExportData}
                        disabled={exporting}
                        className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-[13px] font-bold flex items-center gap-2 cursor-pointer transition-all shadow-xs shrink-0"
                      >
                        <Download className="w-4 h-4 text-[#5B5FEF]" />
                        <span>{exporting ? "Compiling..." : "Download JSON"}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Statutory DPDP compliance banner */}
                <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 flex items-start gap-4">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h5 className="text-[13.5px] font-bold text-slate-800 dark:text-slate-200">
                      India Digital Personal Data Protection Act (DPDP 2023) Notice
                    </h5>
                    <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                      Your identity and sensitive credentials are encrypted using SHA-256 and AES standards. You retain the statutory right to request erasure, rectify data errors, or revoke processing consent through the enterprise grievance officer.
                    </p>
                  </div>
                </div>
              </form>
            )}

            {/* ====================================================
                TAB 4: SECURITY & CREDENTIALS
                ==================================================== */}
            {activeTab === "security" && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-[24px] font-black text-slate-900 dark:text-white tracking-tight">
                    Security & Credentials
                  </h1>
                  <p className="text-[13.5px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                    Update your account password, manage two-factor authentication, and monitor active devices.
                  </p>
                </div>

                {/* Password Update Status Alert */}
                {passwordStatus.type && (
                  <div
                    className={`flex items-center gap-3 p-4 rounded-2xl border animate-in fade-in duration-200 ${
                      passwordStatus.type === "success"
                        ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-300"
                        : "bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/30 text-rose-800 dark:text-rose-300"
                    }`}
                  >
                    {passwordStatus.type === "success" ? (
                      <CheckCircle className="w-5 h-5 shrink-0 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600" />
                    )}
                    <span className="text-[13px] font-bold">{passwordStatus.message}</span>
                  </div>
                )}

                {/* Card 1: Change Password */}
                <form onSubmit={handleUpdatePassword} className="bg-white dark:bg-slate-900/90 rounded-[22px] border border-slate-200/90 dark:border-slate-800 p-6 sm:p-7 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-6">
                  <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    Change Password
                  </p>

                  <div className="space-y-4 max-w-lg">
                    {/* Current Password */}
                    <div>
                      <label className="block text-[13px] font-extrabold text-slate-700 dark:text-slate-300 mb-1.5">
                        Current Password
                      </label>
                      <div className="relative">
                        <input
                          type={showCurrentPw ? "text" : "password"}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="••••••••"
                          required
                          className="w-full pl-4 pr-11 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[13.5px] font-semibold focus:outline-none focus:border-[#5B5FEF] transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPw(!showCurrentPw)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                          aria-label={showCurrentPw ? "Hide current password" : "Show current password"}
                        >
                          {showCurrentPw ? <Eye className="w-4.5 h-4.5" /> : <EyeOff className="w-4.5 h-4.5" />}
                        </button>
                      </div>
                    </div>

                    {/* New Password */}
                    <div>
                      <label className="block text-[13px] font-extrabold text-slate-700 dark:text-slate-300 mb-1.5">
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPw ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="••••••••"
                          required
                          className="w-full pl-4 pr-11 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[13.5px] font-semibold focus:outline-none focus:border-[#5B5FEF] transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPw(!showNewPw)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                          aria-label={showNewPw ? "Hide new password" : "Show new password"}
                        >
                          {showNewPw ? <Eye className="w-4.5 h-4.5" /> : <EyeOff className="w-4.5 h-4.5" />}
                        </button>
                      </div>

                      {/* Password requirements checklist */}
                      {newPassword && (
                        <div className="mt-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-1 text-[11.5px] font-bold">
                          <div className={`flex items-center gap-1.5 ${pwRules.minLen ? "text-emerald-600" : "text-slate-400"}`}>
                            <Check className="w-3.5 h-3.5 shrink-0" />
                            <span>At least 8 characters</span>
                          </div>
                          <div className={`flex items-center gap-1.5 ${pwRules.hasUpper && pwRules.hasLower ? "text-emerald-600" : "text-slate-400"}`}>
                            <Check className="w-3.5 h-3.5 shrink-0" />
                            <span>Both uppercase and lowercase letters</span>
                          </div>
                          <div className={`flex items-center gap-1.5 ${pwRules.hasNumber ? "text-emerald-600" : "text-slate-400"}`}>
                            <Check className="w-3.5 h-3.5 shrink-0" />
                            <span>At least one number (0-9)</span>
                          </div>
                          <div className={`flex items-center gap-1.5 ${pwRules.hasSpecial ? "text-emerald-600" : "text-slate-400"}`}>
                            <Check className="w-3.5 h-3.5 shrink-0" />
                            <span>At least one special character (!@#$...)</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label className="block text-[13px] font-extrabold text-slate-700 dark:text-slate-300 mb-1.5">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPw ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                          required
                          className="w-full pl-4 pr-11 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[13.5px] font-semibold focus:outline-none focus:border-[#5B5FEF] transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPw(!showConfirmPw)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                          aria-label={showConfirmPw ? "Hide confirm password" : "Show confirm password"}
                        >
                          {showConfirmPw ? <Eye className="w-4.5 h-4.5" /> : <EyeOff className="w-4.5 h-4.5" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isUpdatingPassword}
                      className="bg-[#111827] dark:bg-slate-800 hover:bg-black text-white px-6 py-2.5 rounded-xl text-[13.5px] font-black shadow-sm transition-all active:scale-95 cursor-pointer disabled:opacity-50 mt-2"
                    >
                      {isUpdatingPassword ? "Updating Password..." : "Update Password"}
                    </button>
                  </div>
                </form>

                {/* Card 2: Two-Factor Authentication (2FA) */}
                <div className="bg-white dark:bg-slate-900/90 rounded-[22px] border border-slate-200/90 dark:border-slate-800 p-6 sm:p-7 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-6">
                  <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    Multi-Factor Authentication
                  </p>

                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0">
                        <ShieldCheck className="w-5 h-5 text-[#5B5FEF]" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-[14px] font-black text-slate-900 dark:text-white">
                            Two-Factor Authentication (2FA)
                          </h4>
                          <span
                            className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                              twoFactorEnabled
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                                : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                            }`}
                          >
                            {twoFactorEnabled ? "Protected" : "Disabled"}
                          </span>
                        </div>
                        <p className="text-[12.5px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                          Require OTP verification code sent to your registered email on new unrecognized device logins.
                        </p>
                      </div>
                    </div>
                    <ToggleSwitch
                      checked={twoFactorEnabled}
                      disabled={isSaving2FA}
                      onChange={handleToggle2FA}
                      ariaLabel="Toggle Two-Factor Authentication"
                    />
                  </div>
                </div>

                {/* Card 3: Active Browser Sessions */}
                <div className="bg-white dark:bg-slate-900/90 rounded-[22px] border border-slate-200/90 dark:border-slate-800 p-6 sm:p-7 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                        Device & Session Management
                      </p>
                      <h4 className="text-[14px] font-black text-slate-900 dark:text-white mt-1">
                        Active Devices
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={handleTerminateOtherSessions}
                      disabled={terminatingSessions}
                      className="text-[12.5px] font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/40 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>{terminatingSessions ? "Terminating..." : "Terminate Other Sessions"}</span>
                    </button>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-slate-200/70 dark:bg-slate-700/60 flex items-center justify-center text-slate-700 dark:text-slate-200 shrink-0">
                        <Laptop className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="text-[13.5px] font-extrabold text-slate-900 dark:text-white">
                            Windows PC • Chrome / Edge Browser
                          </h5>
                          <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            This Device
                          </span>
                        </div>
                        <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                          Enterprise Workspace Session • Active Now • SSL Encrypted
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ====================================================
                TAB 5: PLATFORM SETTINGS (ADMIN ONLY)
                ==================================================== */}
            {activeTab === "system" && isAdmin && (
              <form onSubmit={handleSaveSystem} className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-[24px] font-black text-slate-900 dark:text-white tracking-tight">
                      Platform & System Administration
                    </h1>
                    <p className="text-[13.5px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                      Configure global organization policies, authentication gates, and registration rules.
                    </p>
                  </div>
                  <button
                    type="submit"
                    disabled={isSavingSystem}
                    className="bg-[#111827] dark:bg-slate-800 hover:bg-black text-white px-6 py-2.5 rounded-xl text-[13.5px] font-black shadow-sm transition-all active:scale-95 cursor-pointer shrink-0 disabled:opacity-50"
                  >
                    {isSavingSystem ? "Saving..." : "Save Platform Configurations"}
                  </button>
                </div>

                <div className="bg-white dark:bg-slate-900/90 rounded-[22px] border border-slate-200/90 dark:border-slate-800 p-6 sm:p-7 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-6">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                      Access & Governance Controls
                    </p>
                    {loadingSystemSettings && (
                      <span className="text-[12px] font-bold text-slate-400 flex items-center gap-1">
                        <RefreshCw className="w-3 h-3 animate-spin" /> Loading configurations...
                      </span>
                    )}
                  </div>

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
                          Temporarily restrict access for non-admin accounts during scheduled database maintenance.
                        </p>
                      </div>
                      <ToggleSwitch
                        checked={maintenanceMode}
                        onChange={setMaintenanceMode}
                        ariaLabel="Toggle Maintenance Mode"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-6 gap-4">
                      <div>
                        <h4 className="text-[14px] font-black text-slate-900 dark:text-white">
                          Session Inactivity Timeout
                        </h4>
                        <p className="text-[12.5px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                          Automatically terminate idle workspace browser sessions.
                        </p>
                      </div>
                      <div className="relative shrink-0 sm:w-60">
                        <select
                          value={sessionTimeoutMinutes}
                          onChange={(e) => setSessionTimeoutMinutes(Number(e.target.value))}
                          className="w-full appearance-none rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 pr-9 text-[13px] font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B5FEF]/20 cursor-pointer shadow-xs"
                        >
                          <option value={15}>15 Minutes</option>
                          <option value={30}>30 Minutes</option>
                          <option value={60}>1 Hour (Standard)</option>
                          <option value={120}>2 Hours</option>
                          <option value={240}>4 Hours</option>
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-6 gap-4">
                      <div>
                        <h4 className="text-[14px] font-black text-slate-900 dark:text-white">
                          Max Failed Logins Before Lockout
                        </h4>
                        <p className="text-[12.5px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                          Brute-force protection threshold before 15-minute temporary IP lockout.
                        </p>
                      </div>
                      <div className="relative shrink-0 sm:w-60">
                        <select
                          value={maxLoginAttempts}
                          onChange={(e) => setMaxLoginAttempts(Number(e.target.value))}
                          className="w-full appearance-none rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 pr-9 text-[13px] font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B5FEF]/20 cursor-pointer shadow-xs"
                        >
                          <option value={3}>3 Attempts (High Security)</option>
                          <option value={5}>5 Attempts (Standard)</option>
                          <option value={10}>10 Attempts (Relaxed)</option>
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-6 gap-4">
                      <div>
                        <h4 className="text-[14px] font-black text-slate-900 dark:text-white">
                          Default Notification Method for Admin Actions
                        </h4>
                        <p className="text-[12.5px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                          Choose how employees are notified by default when you suspend/block them.
                        </p>
                      </div>
                      <div className="relative shrink-0 sm:w-60">
                        <select
                          value={adminActionNotification}
                          onChange={(e) => setAdminActionNotification(e.target.value)}
                          className="w-full appearance-none rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 pr-9 text-[13px] font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B5FEF]/20 cursor-pointer shadow-xs"
                        >
                          <option value="both">Email & System (Recommended)</option>
                          <option value="email">Email Only</option>
                          <option value="system">System Notification Only</option>
                          <option value="none">Silent (No Notification)</option>
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
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
