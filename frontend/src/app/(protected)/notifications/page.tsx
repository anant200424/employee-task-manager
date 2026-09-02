"use client";

import { useEffect, useState } from "react";
import { Topbar } from "@/components/dashboard/Topbar";
import {
  Bell,
  Check,
  Clock,
  MessageSquare,
  AlertTriangle,
  Trash2,
  CheckSquare,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  ListTodo,
  Search,
  Filter,
  X,
  MailCheck,
  Radio,
  Layers,
  FileEdit,
  Loader2,
} from "lucide-react";
import { api } from "@/lib/api";
import { NotificationItem } from "@/types/auth";
import { toast } from "react-hot-toast";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

export default function NotificationsPage() {
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Tabs & Search State
  const [activeTab, setActiveTab] = useState<"unread" | "all" | "messages">("unread");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get("/notifications");
      if (res.data?.data?.notifications) {
        setNotifications(res.data.data.notifications);
      }
    } catch (err) {
      console.error("Failed to load notifications", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.patch("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      toast.success("All notifications marked as read");
    } catch (err) {
      toast.error("Failed to update notifications");
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      toast.success("Notification removed");
    } catch (err) {
      toast.error("Failed to delete notification");
    }
  };

  const formatTimestamp = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diffMs / (1000 * 60));
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  // Counts
  const unreadList = notifications.filter((n) => !n.read);
  const messageList = notifications.filter((n) =>
    n.type === "event" ||
    n.type === "system" ||
    n.title.toLowerCase().includes("message") ||
    n.title.toLowerCase().includes("announcement") ||
    n.title.toLowerCase().includes("workspace")
  );

  // Filter logic
  const filteredNotifications = notifications.filter((item) => {
    // 1. Tab filter
    if (activeTab === "unread" && item.read) return false;
    if (activeTab === "messages") {
      const isMsg =
        item.type === "event" ||
        item.type === "system" ||
        item.title.toLowerCase().includes("message") ||
        item.title.toLowerCase().includes("announcement") ||
        item.title.toLowerCase().includes("broadcast");
      if (!isMsg) return false;
    }

    // 2. Type filter
    if (typeFilter !== "all" && item.type !== typeFilter) return false;

    // 3. Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchMsg = item.message.toLowerCase().includes(q);
      const matchSender = (item.senderName || "").toLowerCase().includes(q);
      const matchCode = (item.taskCode || "").toLowerCase().includes(q);
      if (!matchTitle && !matchMsg && !matchSender && !matchCode) return false;
    }

    return true;
  });

  const getNotificationBadge = (item: NotificationItem) => {
    const titleLower = item.title.toLowerCase();
    if (titleLower.includes("completed")) {
      return {
        label: "Task Completed",
        color: "bg-emerald-500 text-white",
        icon: CheckCircle2,
      };
    }
    if (titleLower.includes("assigned") || titleLower.includes("task")) {
      return {
        label: "Task Action",
        color: "bg-[#5B5FEF] text-white",
        icon: ListTodo,
      };
    }
    if (titleLower.includes("announcement") || titleLower.includes("message")) {
      return {
        label: "Workspace Broadcast",
        color: "bg-amber-500 text-white",
        icon: Radio,
      };
    }
    if (titleLower.includes("review")) {
      return {
        label: "Under Review",
        color: "bg-purple-500 text-white",
        icon: FileEdit,
      };
    }
    return {
      label: "System Alert",
      color: "bg-slate-700 text-white",
      icon: Sparkles,
    };
  };

  return (
    <div className="min-h-screen bg-transparent pb-16 transition-colors duration-300">
      <Topbar
        title={t("notif_hub_title", "Notification & Activity Hub")}
        subtitle={t("notif_hub_sub", "Real-time employee activity stream, task updates, and workspace alerts.")}
        icon={<Bell className="w-5 h-5 text-amber-500" />}
      />

      <main className="px-5 sm:px-7 lg:px-8 space-y-6 max-w-[1240px] mx-auto mt-6 animate-in fade-in duration-300">
        {/* Top Header Card */}
        <div className="bg-white dark:bg-slate-900/90 rounded-[24px] shadow-xs border border-slate-200/90 dark:border-slate-800 p-6 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-13 h-13 rounded-2xl bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0 border border-amber-200/60 dark:border-amber-900/40">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-[20px] font-black text-slate-900 dark:text-white">
                  {t("activity_center", "Activity Center")}
                </h2>
                {unreadList.length > 0 ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-500 text-white animate-pulse">
                    {unreadList.length} NEW
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                    {t("all_caught_up", "All Caught Up")}
                  </span>
                )}
              </div>
              <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                Monitoring live employee task submissions, completions, and team transmissions.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {unreadList.length > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="px-4 py-2.5 rounded-xl bg-[#5B5FEF] hover:bg-[#4E52E2] text-white text-[13px] font-extrabold flex items-center gap-2 cursor-pointer shadow-xs transition-all active:scale-95"
              >
                <MailCheck className="w-4 h-4" />
                <span>{t("mark_all_read", "Mark All Read")}</span>
              </button>
            )}
          </div>
        </div>

        {/* 3 Main Status Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
            <button
              onClick={() => setActiveTab("unread")}
              className={`px-4 py-2 rounded-xl text-[13px] font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === "unread"
                  ? "bg-[#5B5FEF] text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
              <span>{t("unread_and_new", "Unread & New")}</span>
              <span className="px-2 py-0.5 rounded-full text-[11px] bg-white/20 dark:bg-white/10 font-bold">
                {unreadList.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("all")}
              className={`px-4 py-2 rounded-xl text-[13px] font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === "all"
                  ? "bg-[#5B5FEF] text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{t("all_activity_logs", "All Activity Logs")}</span>
              <span className="px-2 py-0.5 rounded-full text-[11px] bg-white/20 dark:bg-white/10 font-bold">
                {notifications.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("messages")}
              className={`px-4 py-2 rounded-xl text-[13px] font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === "messages"
                  ? "bg-[#5B5FEF] text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{t("workspace_messages", "Workspace Messages")}</span>
              <span className="px-2 py-0.5 rounded-full text-[11px] bg-white/20 dark:bg-white/10 font-bold">
                {messageList.length}
              </span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={t("search_notif_placeholder", "Search notifications, tasks, or members...")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-[12.5px] font-bold text-slate-900 dark:text-white outline-none focus:border-[#5B5FEF] transition-colors shadow-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Notifications List Stream */}
        <div className="space-y-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-[24px] border border-slate-200/90 dark:border-slate-800 p-8 text-slate-400 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#5B5FEF]" />
              <p className="text-[14px] font-bold text-slate-500">Loading activity streams...</p>
            </div>
          ) : filteredNotifications.length > 0 ? (
            filteredNotifications.map((item) => {
              const badge = getNotificationBadge(item);
              const BadgeIcon = badge.icon;

              return (
                <div
                  key={item._id}
                  onClick={() => !item.read && handleMarkRead(item._id)}
                  className={`p-5 rounded-[22px] border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer group shadow-xs ${
                    !item.read
                      ? "bg-white dark:bg-slate-900 border-indigo-200/90 dark:border-indigo-900/60 shadow-md ring-1 ring-[#5B5FEF]/10"
                      : "bg-white/80 dark:bg-slate-900/80 border-slate-200/80 dark:border-slate-800/80 opacity-90 hover:opacity-100 hover:bg-white dark:hover:bg-slate-900"
                  }`}
                >
                  <div className="flex items-start gap-4 min-w-0 flex-1">
                    {/* Status Circle Indicator */}
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black shrink-0 ${
                        !item.read
                          ? "bg-indigo-50 dark:bg-indigo-950/40 text-[#5B5FEF] shadow-xs"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                      }`}
                    >
                      <BadgeIcon className="w-5 h-5" />
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`px-2.5 py-0.5 rounded-md text-[10.5px] font-black uppercase flex items-center gap-1 ${badge.color}`}
                        >
                          {badge.label}
                        </span>
                        {item.taskCode && (
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-black font-mono bg-indigo-50 dark:bg-indigo-950/50 text-[#5B5FEF] border border-indigo-200/60 dark:border-indigo-800/50">
                            {item.taskCode}
                          </span>
                        )}
                        {!item.read && (
                          <span className="w-2 h-2 rounded-full bg-[#5B5FEF] animate-ping" />
                        )}
                      </div>

                      <h4 className="text-[14.5px] font-black text-slate-900 dark:text-white leading-snug">
                        {item.title}
                      </h4>

                      <p className="text-[13px] text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                        {item.message}
                      </p>

                      <div className="flex items-center gap-3 pt-1 text-[11.5px] text-slate-400 font-semibold">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {formatTimestamp(item.createdAt)}
                        </span>
                        {item.senderName && (
                          <span>· By <strong className="text-slate-600 dark:text-slate-300">{item.senderName}</strong></span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions Right Strip */}
                  <div className="flex items-center gap-2 shrink-0 sm:self-center pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                    {item.taskCode && (
                      <Link
                        href={`/tasks?search=${item.taskCode}`}
                        onClick={(e) => e.stopPropagation()}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-[#5B5FEF] hover:text-white dark:bg-slate-800 dark:hover:bg-[#5B5FEF] text-slate-700 dark:text-slate-300 text-[12px] font-extrabold flex items-center gap-1 transition-all"
                      >
                        <span>View Task</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    )}

                    {!item.read && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkRead(item._id);
                        }}
                        className="p-2 rounded-xl text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                        title="Mark as read"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      onClick={(e) => handleDelete(e, item._id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="Remove notification"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-20 text-center bg-white dark:bg-slate-900 rounded-[24px] border border-slate-200/90 dark:border-slate-800 p-8 text-slate-400 space-y-2">
              <Bell className="w-10 h-10 mx-auto opacity-30 text-[#5B5FEF]" />
              <h3 className="text-base font-extrabold text-slate-700 dark:text-slate-300">
                {t("no_notifs_found", "No notifications found")}
              </h3>
              <p className="text-xs text-slate-400">
                {activeTab === "unread"
                  ? "You have reviewed all current activity logs."
                  : "No activity records matching your current filter."}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
