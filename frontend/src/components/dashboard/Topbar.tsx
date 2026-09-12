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
  ALargeSmall,
  Globe,
  Check,
  ChevronDown,
  Menu,
  Compass,
  Keyboard,
  BookOpen,
  Sparkles,
  Settings,
  RotateCcw,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import { useLanguage, LANGUAGES } from "@/context/LanguageContext";
import { useSidebar } from "@/context/SidebarContext";
import { api } from "@/lib/api";
import { NotificationItem } from "@/types/auth";
import { toast } from "react-hot-toast";
import dynamic from "next/dynamic";

const GlobalCommandPalette = dynamic(
  () => import("./GlobalCommandPalette").then((mod) => mod.GlobalCommandPalette),
  { ssr: false }
);
import { Breadcrumbs } from "./Breadcrumbs";
import { RecentlyViewedWidget } from "./RecentlyViewedWidget";

interface TopbarProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
}

const MAX_TOASTS_PER_POLL = 2;

export const Topbar = ({ title, subtitle, icon }: TopbarProps) => {
  const { user, logout } = useAuth();
  const { language, setLanguage, currentLanguageOption, t } = useLanguage();
  const { isCollapsed, toggleSidebar } = useSidebar();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [scaleOpen, setScaleOpen] = useState(false);
  const [scale, setScale] = useState(100);
  const [helpOpen, setHelpOpen] = useState(false);
  const [searchPaletteOpen, setSearchPaletteOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);
  const scaleRef = useRef<HTMLDivElement>(null);
  const helpRef = useRef<HTMLDivElement>(null);

  const [theme, setTheme] = useState<"light" | "dark">("light");
  const { socket } = useSocket();
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentNotifs, setRecentNotifs] = useState<NotificationItem[]>([]);
  const knownNotificationIds = useRef<Set<string>>(new Set());
  const isFirstLoad = useRef(true);

  // Global Cmd+K / Ctrl+K keyboard shortcut to toggle omnisearch
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchPaletteOpen((prev) => !prev);
      }
    };
    const handleOpenSearch = () => setSearchPaletteOpen(true);

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("nexus-open-search", handleOpenSearch);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("nexus-open-search", handleOpenSearch);
    };
  }, []);

  // Initialize and apply saved display scaling
  useEffect(() => {
    const savedScale = parseInt(localStorage.getItem("app_scale") || "100", 10);
    if (!isNaN(savedScale) && savedScale >= 80 && savedScale <= 150) {
      setScale(savedScale);
      applyScale(savedScale);
    }
  }, []);

  const applyScale = (s: number) => {
    document.documentElement.style.fontSize = `${16 * (s / 100)}px`;
    (document.documentElement.style as any).zoom = `${s / 100}`;
    localStorage.setItem("app_scale", s.toString());
    window.dispatchEvent(new CustomEvent("scale-change", { detail: s }));
  };

  const handleScaleChange = (newScale: number) => {
    const clamped = Math.max(85, Math.min(150, newScale));
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

  // Fetch existing notifications once on mount to populate unread badge and dropdown
  useEffect(() => {
    if (!user?._id) return;

    let isMounted = true;
    const fetchInitialNotifications = async () => {
      try {
        const res = await api.get("/notifications");
        if (!isMounted) return;
        if (res.data?.data) {
          const count = res.data.data.unreadCount || 0;
          setUnreadCount(count);

          const list: NotificationItem[] = res.data.data.notifications || [];
          setRecentNotifs(list.filter((n) => !n.read).slice(0, 5));
          list.forEach((n) => knownNotificationIds.current.add(n._id));
          isFirstLoad.current = false;
        }
      } catch {
        // silent fail on network/auth
      }
    };

    fetchInitialNotifications();
    return () => {
      isMounted = false;
    };
  }, [user?._id]);

  // Real-time WebSocket listener for new notifications (0 polling, 0 extra HTTP calls)
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (n: NotificationItem) => {
      if (!n || knownNotificationIds.current.has(n._id)) return;
      knownNotificationIds.current.add(n._id);

      // Increment badge count
      setUnreadCount((prev) => prev + 1);

      // Add to recent dropdown preview
      setRecentNotifs((prev) => [n, ...prev.slice(0, 4)]);

      // Trigger instant toast notification
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
        { duration: 4000, position: "top-right" }
      );
    };

    socket.on("notification:new", handleNewNotification);
    return () => {
      socket.off("notification:new", handleNewNotification);
    };
  }, [socket, router]);

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
      if (helpRef.current && !helpRef.current.contains(event.target as Node)) {
        setHelpOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // ignore
    } finally {
      if (typeof window !== "undefined") {
        window.location.replace("/login");
      }
    }
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
    <header
      className="glass-header flex items-center justify-between px-3.5 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 gap-2.5 sm:gap-4 sticky top-0 z-40 transition-colors duration-300 ease-in-out shadow-[0_1px_3px_rgba(0,0,0,0.03)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.2)]"
    >
      {/* Title, Breadcrumbs & 3-Line Sidebar Toggle */}
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
        {/* 3-Line Sidebar Side-Collapse Toggle Button */}
        <button
          onClick={toggleSidebar}
          aria-label={isCollapsed ? t("expand_sidebar", "Expand sidebar") : t("collapse_sidebar", "Collapse sidebar")}
          title={isCollapsed ? `${t("expand_sidebar", "Expand sidebar")} (Ctrl + [)` : `${t("collapse_sidebar", "Collapse sidebar")} (Ctrl + [)`}
          className="w-9 h-9 rounded-xl border border-slate-200/90 dark:border-slate-700/90 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all flex items-center justify-center shadow-2xs cursor-pointer shrink-0 group active:scale-95"
        >
          <Menu className="w-4.5 h-4.5 group-hover:scale-105 transition-transform" />
        </button>

        {icon && (
          <div className="hidden sm:flex w-10 h-10 bg-indigo-50 dark:bg-indigo-950/50 text-[#5B5FEF] rounded-xl items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-800/60 shadow-2xs">
            {icon}
          </div>
        )}
        <div className="min-w-0 flex-1">
          {/* Dynamic Hierarchy Breadcrumbs Trail */}
          <Breadcrumbs className="hidden sm:flex mb-0.5" />
          <h1 className="text-[16px] sm:text-[19px] lg:text-[21px] font-black text-slate-900 dark:text-white tracking-tight leading-tight transition-colors truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="hidden md:block text-[12.5px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5 transition-colors truncate">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3.5">
        {/* Search Trigger Button with Crisp Border & Contrast */}
        <button
          type="button"
          onClick={() => setSearchPaletteOpen(true)}
          className="hidden md:flex items-center relative pl-9 pr-14 py-2 w-[220px] lg:w-[260px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900 hover:bg-white dark:hover:bg-slate-800 text-[13px] font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none focus:border-[#5B5FEF] focus:ring-2 focus:ring-[#5B5FEF]/15 transition-all shadow-2xs cursor-pointer text-left group"
          title="Search workspace (Cmd+K / Ctrl+K)"
        >
          <Search className="w-4 h-4 text-slate-400 group-hover:text-[#5B5FEF] absolute left-3 transition-colors" />
          <span className="truncate">{t("search_workspace", "Search workspace...")}</span>
          <div className="absolute right-2 text-[10px] font-extrabold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 shadow-2xs group-hover:border-[#5B5FEF]/40 transition-colors">
            Cmd+K
          </div>
        </button>

        {/* Mobile Search Icon Button */}
        <button
          type="button"
          onClick={() => setSearchPaletteOpen(true)}
          className="md:hidden p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-[#5B5FEF] transition-colors cursor-pointer"
          title="Search workspace"
          aria-label="Search workspace"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Preferences Segment Capsule (Language & Display Zoom) */}
        <div className="hidden lg:flex items-center p-0.5 rounded-xl bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
          {/* 1. Language Switcher Dropdown */}
          <div ref={langRef} className="relative">
            <button
              onClick={() => {
                setLangOpen((v) => !v);
                setScaleOpen(false);
                setNotifOpen(false);
                setHelpOpen(false);
                setOpen(false);
              }}
              className="rounded-lg px-2.5 py-1 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700/90 transition-all flex items-center gap-1.5 cursor-pointer text-[12px] font-extrabold"
              aria-label={t("language")}
              title={t("language")}
            >
              <span className="text-sm leading-none">{currentLanguageOption.flag}</span>
              <span>{currentLanguageOption.code.toUpperCase()}</span>
              <ChevronDown className="w-2.5 h-2.5 text-slate-400" />
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

          {/* Capsule Divider */}
          <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-0.5" />

          {/* 2. Page Size Increment & Decrement (Scale) Dropdown */}
          <div ref={scaleRef} className="relative">
            <button
              onClick={() => {
                setScaleOpen((v) => !v);
                setLangOpen(false);
                setNotifOpen(false);
                setHelpOpen(false);
                setOpen(false);
              }}
              className={`rounded-lg px-2.5 py-1 transition-all flex items-center gap-1.5 cursor-pointer text-[12px] font-extrabold ${
                scaleOpen
                  ? "bg-[#EEF0FF] dark:bg-[#5B5FEF]/20 text-[#5B5FEF] dark:text-[#818CF8]"
                  : "text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700/90"
              }`}
              aria-label={t("display_scale", "Display Size")}
              title={t("display_scale", "Display Size & Accessibility Zoom")}
            >
              <ALargeSmall className="w-3.5 h-3.5 text-[#5B5FEF] dark:text-[#818CF8]" />
              <span>{scale}%</span>
              <ChevronDown className="w-2.5 h-2.5 text-slate-400" />
            </button>

            {/* Display Size Scale Dropdown Menu */}
            {scaleOpen && (
              <div className="absolute right-0 top-full z-50 mt-2.5 w-[290px] sm:w-[310px] max-w-[calc(100vw-24px)] overflow-hidden rounded-2xl border border-slate-200/90 dark:border-slate-700/90 bg-white dark:bg-slate-900 shadow-[0_20px_60px_rgba(15,23,42,0.18)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.6)] p-3.5 space-y-3 animate-in fade-in zoom-in-95">
                {/* Header with Title and Current Value */}
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-[#5B5FEF] dark:text-indigo-400">
                      <ALargeSmall className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-[13px] font-extrabold text-slate-900 dark:text-white leading-tight">
                        {t("accessibility_display", "Display & Sizing")}
                      </h4>
                      <p className="text-[10.5px] text-slate-400 font-medium leading-tight mt-0.5">
                        Adjust UI text & layout scale
                      </p>
                    </div>
                  </div>
                  <span className="text-[12px] font-black text-[#5B5FEF] dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-0.5 rounded-full border border-indigo-200/60 dark:border-indigo-800/60 shadow-2xs">
                    {scale}%
                  </span>
                </div>

                {/* Interactive Stepper with Visual Scale Gauge */}
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleScaleChange(scale - 5)}
                      disabled={scale <= 85}
                      className="w-9 h-9 rounded-xl bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-800 dark:text-white disabled:opacity-40 transition-all font-black text-base flex items-center justify-center shadow-xs border border-slate-200 dark:border-slate-600 cursor-pointer active:scale-95 shrink-0"
                      title={t("decrease_size", "Decrease Size (-5%)")}
                    >
                      <ZoomOut className="w-4 h-4" />
                    </button>

                    <div className="flex-1 text-center px-2">
                      <span className="text-[13px] font-black text-slate-800 dark:text-slate-100">
                        {scale === 100 ? "Standard 100%" : `${scale}% Magnification`}
                      </span>
                      {/* Visual Meter Bar */}
                      <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mt-1.5">
                        <div
                          className="h-full bg-gradient-to-r from-[#5B5FEF] to-purple-500 transition-all duration-200 rounded-full"
                          style={{ width: `${Math.min(100, Math.max(10, ((scale - 85) / (150 - 85)) * 100))}%` }}
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => handleScaleChange(scale + 5)}
                      disabled={scale >= 150}
                      className="w-9 h-9 rounded-xl bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-800 dark:text-white disabled:opacity-40 transition-all font-black text-base flex items-center justify-center shadow-xs border border-slate-200 dark:border-slate-600 cursor-pointer active:scale-95 shrink-0"
                      title={t("increase_size", "Increase Size (+5%)")}
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Scale Presets List */}
                <div className="space-y-1">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-400 px-1 mb-1">
                    Preset Sizing Options
                  </p>
                  {[
                    { value: 90, label: t("size_compact", "Compact"), percent: "90%", tag: "A-" },
                    { value: 100, label: t("size_default", "Default Standard"), percent: "100%", tag: "A" },
                    { value: 115, label: t("size_medium", "Medium Enhanced"), percent: "115%", tag: "A+" },
                    { value: 130, label: t("size_large", "Large Readable"), percent: "130%", tag: "A++" },
                    { value: 150, label: t("size_huge", "Maximum Large"), percent: "150%", tag: "A+++" },
                  ].map((preset) => {
                    const isCurrent = scale === preset.value;
                    return (
                      <button
                        key={preset.value}
                        onClick={() => handleScaleChange(preset.value)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[12.5px] font-bold transition-all cursor-pointer ${
                          isCurrent
                            ? "bg-[#EEF0FF] dark:bg-[#5B5FEF]/20 text-[#5B5FEF] dark:text-[#818CF8] border border-[#5B5FEF]/30 shadow-2xs font-extrabold"
                            : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 border border-transparent"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${isCurrent ? "bg-[#5B5FEF]" : "bg-slate-300 dark:bg-slate-600"}`} />
                          <span>{preset.label}</span>
                          <span className="text-[11px] opacity-70 font-semibold">({preset.percent})</span>
                        </div>
                        <span className={`text-[11px] font-mono font-black px-1.5 py-0.5 rounded-md ${
                          isCurrent
                            ? "bg-[#5B5FEF] text-white"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                        }`}>
                          {preset.tag}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Reset to 100% Footer Action */}
                {scale !== 100 && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => handleScaleChange(100)}
                      className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[12px] font-extrabold transition-all cursor-pointer active:scale-95"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>{t("reset_size", "Reset to 100% Default")}</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 2. Utility Actions Strip (Recently Viewed, Theme, Notifications, Unified Help & Resources) */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Recently Viewed Activity Log Widget */}
          <RecentlyViewedWidget />

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-xl border border-slate-200/90 dark:border-slate-700/90 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all flex items-center justify-center shadow-2xs cursor-pointer active:scale-95"
            aria-label={t("toggle_theme")}
            title={theme === "dark" ? t("switch_light") : t("switch_dark")}
          >
            {theme === "dark" ? (
              <Sun className="h-4.5 w-4.5 text-amber-500" />
            ) : (
              <Moon className="h-4.5 w-4.5 text-slate-600" />
            )}
          </button>

          {/* Notifications Button */}
          <div ref={notifRef} className="relative">
            <button
              onClick={() => {
                setNotifOpen((v) => !v);
                setHelpOpen(false);
                setLangOpen(false);
                setScaleOpen(false);
                setOpen(false);
              }}
              className="w-9 h-9 rounded-xl border border-slate-200/90 dark:border-slate-700/90 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all flex items-center justify-center shadow-2xs cursor-pointer relative active:scale-95"
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

          {/* Unified Production Help & Resources Menu */}
          <div ref={helpRef} className="relative">
            <button
              type="button"
              onClick={() => {
                setHelpOpen((v) => !v);
                setNotifOpen(false);
                setLangOpen(false);
                setScaleOpen(false);
                setOpen(false);
              }}
              className={`w-9 h-9 rounded-xl border transition-all flex items-center justify-center shadow-2xs cursor-pointer active:scale-95 ${
                helpOpen
                  ? "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800 text-[#5B5FEF]"
                  : "bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-700/90 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              }`}
              title="Help, Guides & Shortcuts"
              aria-label="Help & Resources"
            >
              <HelpCircle className="h-4.5 w-4.5" />
            </button>

            {helpOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-[275px] overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-[0_12px_40px_rgba(15,23,42,0.15)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.4)] p-1.5 space-y-1 animate-in fade-in zoom-in-95">
                {/* Dropdown Header */}
                <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700/80 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#5B5FEF]" />
                    <span className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Help & Resources
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-[#5B5FEF] bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full border border-indigo-200/60">
                    EmpSphere
                  </span>
                </div>

                {/* 1. Interactive Guided Tour */}
                <button
                  type="button"
                  onClick={() => {
                    setHelpOpen(false);
                    window.dispatchEvent(new Event("nexus-start-tour"));
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-[12.5px] font-bold text-slate-700 dark:text-slate-200 hover:bg-indigo-50/60 dark:hover:bg-indigo-950/40 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-[#5B5FEF] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <Compass className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <p className="leading-tight text-slate-900 dark:text-white">Workspace Tour</p>
                      <p className="text-[10.5px] text-slate-400 font-medium">Interactive walkthrough</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md border border-indigo-200/60">
                    Tour
                  </span>
                </button>

                {/* 2. Keyboard Shortcuts */}
                <button
                  type="button"
                  onClick={() => {
                    setHelpOpen(false);
                    window.dispatchEvent(new Event("nexus-open-shortcuts"));
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-[12.5px] font-bold text-slate-700 dark:text-slate-200 hover:bg-amber-50/60 dark:hover:bg-amber-950/40 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <Keyboard className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <p className="leading-tight text-slate-900 dark:text-white">Keyboard Shortcuts</p>
                      <p className="text-[10.5px] text-slate-400 font-medium">Navigation cheat sheet</p>
                    </div>
                  </div>
                  <kbd className="text-[10.5px] font-mono font-black text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-600 shadow-2xs">
                    ?
                  </kbd>
                </button>

                {/* 3. Help Center Documentation */}
                <button
                  type="button"
                  onClick={() => {
                    setHelpOpen(false);
                    router.push("/help");
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-[12.5px] font-bold text-slate-700 dark:text-slate-200 hover:bg-emerald-50/60 dark:hover:bg-emerald-950/40 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <p className="leading-tight text-slate-900 dark:text-white">Documentation</p>
                      <p className="text-[10.5px] text-slate-400 font-medium">Guides, FAQs & features</p>
                    </div>
                  </div>
                  <span className="text-[10.5px] font-extrabold text-slate-400 group-hover:text-emerald-600 transition-colors">
                    Docs →
                  </span>
                </button>

                {/* 4. Community & Feedback */}
                <button
                  type="button"
                  onClick={() => {
                    setHelpOpen(false);
                    router.push("/empty-states");
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-[12.5px] font-bold text-slate-700 dark:text-slate-200 hover:bg-sky-50/60 dark:hover:bg-sky-950/40 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <p className="leading-tight text-slate-900 dark:text-white">Workspace Hub</p>
                      <p className="text-[10.5px] text-slate-400 font-medium">Feedback & community</p>
                    </div>
                  </div>
                </button>

                {/* Dropdown Footer */}
                <div className="pt-1.5 pb-1 px-3 border-t border-slate-100 dark:border-slate-700/80 text-[10.5px] text-slate-400 flex items-center justify-between font-medium">
                  <span>Quick Search</span>
                  <span className="font-mono font-bold">Ctrl + K</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Vertical Divider */}
        <div className="h-6 w-px bg-slate-200 dark:bg-slate-700/80" />

        {/* User Profile Avatar Dropdown */}
        <div ref={menuRef} className="relative">
          <button
            onClick={() => {
              setOpen((v) => {
                if (!v) {
                  setHelpOpen(false);
                  setNotifOpen(false);
                  setLangOpen(false);
                  setScaleOpen(false);
                }
                return !v;
              });
            }}
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
                <Settings className="h-4 w-4 text-slate-400" /> {t("settings")}
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

      {/* Global Command Palette Spotlight Modal */}
      <GlobalCommandPalette
        isOpen={searchPaletteOpen}
        onClose={() => setSearchPaletteOpen(false)}
      />
    </header>
  );
};
