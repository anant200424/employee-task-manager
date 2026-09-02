"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  LogOut,
  User as UserIcon,
  Search,
  MessageSquare,
  HelpCircle,
  Sun,
  Moon,
  CheckSquare,
  CheckCheck,
  ExternalLink,
  Languages,
  ALargeSmall,
  Globe,
  Check,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage, LANGUAGES } from "@/context/LanguageContext";
import { api } from "@/lib/api";
import { NotificationItem } from "@/types/auth";
import { toast } from "react-hot-toast";

interface TopbarProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
}

const MAX_TOASTS_PER_POLL = 2;

export const Topbar = ({ title, subtitle, icon }: TopbarProps) => {
  const { user, logout } = useAuth();
  const { language, setLanguage, currentLanguageOption, t } = useLanguage();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [scaleOpen, setScaleOpen] = useState(false);
  const [scale, setScale] = useState(100);

  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);
  const scaleRef = useRef<HTMLDivElement>(null);

  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentNotifs, setRecentNotifs] = useState<NotificationItem[]>([]);
  const knownNotificationIds = useRef<Set<string>>(new Set());
  const isFirstLoad = useRef(true);

  // Initialize and apply saved display scaling
  useEffect(() => {
    const savedScale = parseInt(localStorage.getItem("app_scale") || "100", 10);
    if (!isNaN(savedScale) && savedScale >= 80 && savedScale <= 130) {
      setScale(savedScale);
      applyScale(savedScale);
    }
  }, []);

  const applyScale = (s: number) => {
    document.documentElement.style.fontSize = `${16 * (s / 100)}px`;
    localStorage.setItem("app_scale", s.toString());
  };

  const handleScaleChange = (newScale: number) => {
    const clamped = Math.max(80, Math.min(130, newScale));
    setScale(clamped);
    applyScale(clamped);
    toast.success(`Display scale: ${clamped}%`, { id: "scale-toast" });
  };

  useEffect(() => {
    const updateThemeState = () => {
      const savedTheme = (localStorage.getItem("theme") as "light" | "dark" | "system") || "light";
      let isDark = false;
      if (savedTheme === "dark") {
        isDark = true;
      } else if (savedTheme === "system") {
        isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      } else {
        isDark = false;
      }

      setTheme(isDark ? "dark" : "light");
      if (isDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    };

    updateThemeState();
    window.addEventListener("theme-change", updateThemeState);
    window.addEventListener("storage", updateThemeState);

    return () => {
      window.removeEventListener("theme-change", updateThemeState);
      window.removeEventListener("storage", updateThemeState);
    };
  }, []);

  // Poll for notifications — limited toast alerts
  useEffect(() => {
    if (!user) return;

    let isMounted = true;
    const checkNotifications = async () => {
      try {
        const res = await api.get("/notifications");
        if (!isMounted) return;
        if (res.data?.data) {
          const count = res.data.data.unreadCount || 0;
          setUnreadCount(count);

          const list: NotificationItem[] = res.data.data.notifications || [];
          // Store the latest 5 for the dropdown preview
          setRecentNotifs(list.filter((n) => !n.read).slice(0, 5));

          // On first load, just register all existing IDs — don't spam toasts
          if (isFirstLoad.current) {
            list.forEach((n) => knownNotificationIds.current.add(n._id));
            isFirstLoad.current = false;
            return;
          }

          // Collect truly new notifications
          const brandNew = list.filter(
            (n) => !n.read && !knownNotificationIds.current.has(n._id)
          );

          // Only toast for max 2 per cycle
          let toastCount = 0;
          for (const n of brandNew) {
            if (toastCount >= MAX_TOASTS_PER_POLL) break;
            toastCount++;
            const isTask = n.type === "task";

            toast(
              (t) => (
                <div
                  onClick={() => {
                    toast.dismiss(t.id);
                    router.push(isTask ? "/tasks" : "/notifications");
                  }}
                  className="flex items-start gap-2.5 cursor-pointer select-none"
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      isTask
                        ? "bg-indigo-500/20 text-indigo-400"
                        : "bg-amber-500/20 text-amber-400"
                    }`}
                  >
                    {isTask ? (
                      <CheckSquare className="w-3.5 h-3.5" />
                    ) : (
                      <MessageSquare className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-bold text-white truncate leading-tight">
                      {n.title}
                    </p>
                    <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
                      {n.message}
                    </p>
                  </div>
                  <ExternalLink className="w-3 h-3 text-slate-500 shrink-0 mt-0.5" />
                </div>
              ),
              { duration: 4000, position: "top-right" },
            );
          }

          // If there were more beyond the limit, show a summary
          if (brandNew.length > MAX_TOASTS_PER_POLL) {
            const extra = brandNew.length - MAX_TOASTS_PER_POLL;
            toast(`+${extra} more new notifications`, {
              duration: 3000,
              icon: "🔔",
              position: "top-right",
            });
          }

          // Register ALL IDs (including ones we didn't toast)
          list.forEach((n) => knownNotificationIds.current.add(n._id));
        }
      } catch {
        // silent fail on network/auth
      }
    };

    checkNotifications();
    const interval = setInterval(checkNotifications, 15000); // poll every 15 seconds
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [user, router]);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    if (newTheme === "dark") {
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
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
      if (langRef.current && !langRef.current.contains(event.target as Node)) {
        setLangOpen(false);
      }
      if (scaleRef.current && !scaleRef.current.contains(event.target as Node)) {
        setScaleOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch("/notifications/read-all");
      setUnreadCount(0);
      setRecentNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
      toast.success("All notifications marked as read");
    } catch {
      toast.error("Failed to mark notifications as read");
    }
  };

  const initials = user
    ? `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase()
    : "EM";

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const d = new Date(date);
    const diffMs = now.getTime() - d.getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-[#0F172A]/95 backdrop-blur-md px-6 lg:px-8 py-3.5 gap-4 sticky top-0 z-40 transition-colors duration-300 shadow-[0_1px_3px_rgba(0,0,0,0.03)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.2)]">
      {/* Title */}
      <div className="flex items-center gap-3">
        {icon && (
          <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-950/50 text-[#5B5FEF] rounded-xl flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-800/60 shadow-2xs">
            {icon}
          </div>
        )}
        <div>
          <h1 className="text-[19px] lg:text-[21px] font-black text-slate-900 dark:text-white tracking-tight leading-tight transition-colors">
            {title}
          </h1>
          {subtitle && (
            <p className="text-[12.5px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5 transition-colors">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3.5">
        {/* Search Bar with Crisp Border & Contrast */}
        <div className="hidden md:flex items-center relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
          <input
            type="text"
            placeholder={t("search_workspace")}
            className="pl-9 pr-14 py-2 w-[220px] lg:w-[260px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900 text-[13px] font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#5B5FEF] focus:ring-2 focus:ring-[#5B5FEF]/15 transition-all shadow-2xs"
          />
          <div className="absolute right-2 text-[10px] font-extrabold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 shadow-2xs">
            Cmd+K
          </div>
        </div>

        <div className="flex items-center gap-2 border-r border-slate-200 dark:border-slate-800 pr-3.5">
          {/* 1. Language Switcher Dropdown */}
          <div ref={langRef} className="relative">
            <button
              onClick={() => {
                setLangOpen((v) => !v);
                setScaleOpen(false);
                setNotifOpen(false);
                setOpen(false);
              }}
              className="relative rounded-xl px-2.5 py-1.5 text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-2 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 cursor-pointer shadow-2xs"
              aria-label={t("language")}
              title={t("language")}
            >
              <div className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-[#5B5FEF] flex items-center justify-center shrink-0">
                <Languages className="w-3.5 h-3.5" />
              </div>
              <span className="text-[12px] font-black flex items-center gap-1">
                <span>{currentLanguageOption.flag}</span>
                <span className="hidden sm:inline">{currentLanguageOption.code.toUpperCase()}</span>
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {/* Language Dropdown Menu */}
            {langOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-[210px] overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-[0_12px_40px_rgba(15,23,42,0.15)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.4)] p-1.5 space-y-1 animate-in fade-in zoom-in-95">
                <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-700/80 mb-1 flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5 text-[#5B5FEF]" />
                  <span className="text-[11px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-wider">
                    {t("language")}
                  </span>
                </div>
                {LANGUAGES.map((lang) => {
                  const isSelected = language === lang.code;
                  return (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setLanguage(lang.code);
                        setLangOpen(false);
                        toast.success(`${t("lang_set_to")} ${lang.name} (${lang.nativeName})`);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[12.5px] font-bold transition-all cursor-pointer ${
                        isSelected
                          ? "bg-[#EEF0FF] dark:bg-[#5B5FEF]/20 text-[#5B5FEF] dark:text-[#818CF8]"
                          : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-base leading-none">{lang.flag}</span>
                        <div className="text-left">
                          <p className="leading-tight">{lang.name}</p>
                          <p className="text-[10.5px] text-slate-400 font-medium">{lang.nativeName}</p>
                        </div>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#5B5FEF]" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 2. Page Size Increment & Decrement (Scale) Dropdown */}
          <div ref={scaleRef} className="relative">
            <button
              onClick={() => {
                setScaleOpen((v) => !v);
                setLangOpen(false);
                setNotifOpen(false);
                setOpen(false);
              }}
              className="relative rounded-xl px-2.5 py-1.5 text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-2 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 cursor-pointer shadow-2xs"
              aria-label={t("display_scale")}
              title={t("display_scale")}
            >
              <div className="w-6 h-6 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <ALargeSmall className="w-3.5 h-3.5" />
              </div>
              <span className="text-[12px] font-black hidden sm:inline">
                {scale}%
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {/* Display Size Scale Dropdown Menu */}
            {scaleOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-[220px] overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-[0_12px_40px_rgba(15,23,42,0.15)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.4)] p-2.5 space-y-2 animate-in fade-in zoom-in-95">
                <div className="px-1.5 pb-2 border-b border-slate-100 dark:border-slate-700/80 flex items-center justify-between">
                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
                    {t("display_scale")}
                  </span>
                  <span className="text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200/50">
                    {scale}%
                  </span>
                </div>

                {/* Quick Increment / Decrement Stepper */}
                <div className="flex items-center justify-between gap-2 p-1.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-700/60">
                  <button
                    onClick={() => handleScaleChange(scale - 5)}
                    disabled={scale <= 80}
                    className="p-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 disabled:opacity-40 transition-all font-black text-sm w-8 h-8 flex items-center justify-center shadow-xs cursor-pointer"
                    title={t("decrease_size")}
                  >
                    -
                  </button>
                  <span className="text-[12px] font-extrabold text-slate-800 dark:text-slate-200">
                    {t("text_size")}
                  </span>
                  <button
                    onClick={() => handleScaleChange(scale + 5)}
                    disabled={scale >= 130}
                    className="p-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 disabled:opacity-40 transition-all font-black text-sm w-8 h-8 flex items-center justify-center shadow-xs cursor-pointer"
                    title={t("increase_size")}
                  >
                    +
                  </button>
                </div>

                {/* Scale Presets */}
                <div className="space-y-1 pt-1">
                  {[
                    { value: 90, label: t("size_compact"), tag: "A-" },
                    { value: 100, label: t("size_default"), tag: "A" },
                    { value: 110, label: t("size_medium"), tag: "A+" },
                    { value: 125, label: t("size_large"), tag: "A++" },
                  ].map((preset) => {
                    const isCurrent = scale === preset.value;
                    return (
                      <button
                        key={preset.value}
                        onClick={() => handleScaleChange(preset.value)}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-[12px] font-bold transition-all cursor-pointer ${
                          isCurrent
                            ? "bg-[#EEF0FF] dark:bg-[#5B5FEF]/20 text-[#5B5FEF] dark:text-[#818CF8]"
                            : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60"
                        }`}
                      >
                        <span>{preset.label}</span>
                        <span className="text-[11px] font-mono opacity-60 font-bold">
                          {preset.tag}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 3. Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all flex items-center justify-center shadow-2xs cursor-pointer"
            aria-label={t("toggle_theme")}
            title={theme === "dark" ? t("switch_light") : t("switch_dark")}
          >
            {theme === "dark" ? (
              <Sun className="h-4.5 w-4.5 text-amber-500" />
            ) : (
              <Moon className="h-4.5 w-4.5 text-slate-600" />
            )}
          </button>

          {/* 4. Notifications Button */}
          <div ref={notifRef} className="relative">
            <button
              onClick={() => setNotifOpen((v) => !v)}
              className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all flex items-center justify-center shadow-2xs cursor-pointer relative"
              aria-label={t("notifications_title")}
              title={t("notifications_title")}
            >
              <Bell className="h-4.5 w-4.5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center ring-2 ring-white dark:ring-slate-900 shadow-xs animate-pulse">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Mini Dropdown */}
            {notifOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-[340px] overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-[0_12px_40px_rgba(15,23,42,0.15)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.4)]"
                style={{ animation: "fadeInScale 0.15s ease-out" }}
              >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <h3 className="text-[13px] font-extrabold text-slate-900 dark:text-white">
                      {t("notifications_title")}
                    </h3>
                    {unreadCount > 0 && (
                      <span className="text-[10px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAllRead();
                      }}
                      className="flex items-center gap-1 text-[11px] font-bold text-[#5B5FEF] hover:text-indigo-700 transition-colors cursor-pointer"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      {t("mark_all_read")}
                    </button>
                  )}
                </div>

                {/* Notification List (max 5 items) */}
                <div className="max-h-[280px] overflow-y-auto">
                  {recentNotifs.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                      <Bell className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                      <p className="text-[12px] text-slate-400 dark:text-slate-500 font-medium">
                        {t("no_notifications")}
                      </p>
                    </div>
                  ) : (
                    recentNotifs.map((n) => (
                      <div
                        key={n._id}
                        onClick={() => {
                          setNotifOpen(false);
                          router.push(n.type === "task" ? "/tasks" : "/notifications");
                        }}
                        className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/50 border-b border-slate-50 dark:border-slate-700/50 last:border-0 ${
                          !n.read ? "bg-indigo-50/40 dark:bg-indigo-900/10" : ""
                        }`}
                      >
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                            n.type === "task"
                              ? "bg-indigo-100 text-[#5B5FEF] dark:bg-indigo-900/40"
                              : "bg-amber-100 text-amber-600 dark:bg-amber-900/40"
                          }`}
                        >
                          {n.type === "task" ? (
                            <CheckSquare className="w-3.5 h-3.5" />
                          ) : (
                            <MessageSquare className="w-3.5 h-3.5" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[12px] font-bold text-slate-800 dark:text-white truncate leading-tight">
                            {n.title}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                            {n.message}
                          </p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                            {formatTimeAgo(n.createdAt)}
                          </p>
                        </div>
                        {!n.read && (
                          <div className="w-2 h-2 rounded-full bg-[#5B5FEF] shrink-0 mt-1.5" />
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* Footer — View All */}
                <div className="border-t border-slate-100 dark:border-slate-700">
                  <button
                    onClick={() => {
                      setNotifOpen(false);
                      router.push("/notifications");
                    }}
                    className="w-full px-4 py-2.5 text-[12px] font-bold text-[#5B5FEF] hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-center cursor-pointer"
                  >
                    {t("view_all_notifications")} →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 5. Messages Button */}
          <button
            onClick={() => router.push("/empty-states")}
            className="hidden sm:flex w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all items-center justify-center shadow-2xs cursor-pointer"
            aria-label={t("workspace_hub")}
            title={t("workspace_hub")}
          >
            <MessageSquare className="h-4.5 w-4.5" />
          </button>

          {/* 6. Help Button */}
          <button
            onClick={() => router.push("/help")}
            className="hidden sm:flex w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all items-center justify-center shadow-2xs cursor-pointer"
            aria-label={t("help")}
            title={t("help")}
          >
            <HelpCircle className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* User Profile Avatar Dropdown */}
        <div ref={menuRef} className="relative">
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-2 rounded-full ring-2 ring-slate-200 dark:ring-slate-700 hover:ring-[#5B5FEF] transition-all cursor-pointer shadow-2xs p-0.5"
            title={user ? `${user.firstName} ${user.lastName}` : t("profile")}
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1E293B] text-xs font-bold text-white overflow-hidden">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.firstName}
                  className="h-full w-full object-cover"
                />
              ) : (
                initials
              )}
            </span>
          </button>

          {open && (
            <div className="absolute right-0 top-full z-30 mt-2 w-56 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-1.5 shadow-[0_12px_36px_rgba(15,23,42,0.12)] animate-in fade-in zoom-in-95">
              <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700/80">
                <p className="text-[13px] font-bold text-slate-900 dark:text-white">
                  {user ? `${user.firstName} ${user.lastName}` : ""}
                </p>
                <p className="text-[11.5px] text-slate-400 truncate">
                  {user?.email}
                </p>
              </div>

              <button
                onClick={() => {
                  setOpen(false);
                  router.push("/profile");
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 cursor-pointer mt-1"
              >
                <UserIcon className="h-4 w-4 text-slate-400" /> {t("profile")}
              </button>

              <button
                onClick={() => {
                  setOpen(false);
                  router.push("/settings");
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 cursor-pointer"
              >
                <HelpCircle className="h-4 w-4 text-slate-400" /> {t("settings")}
              </button>

              <div className="border-t border-slate-100 dark:border-slate-700/80 my-1" />

              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
              >
                <LogOut className="h-4 w-4" /> {t("sign_out")}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
