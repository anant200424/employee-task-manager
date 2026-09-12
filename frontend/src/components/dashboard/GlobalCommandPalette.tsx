"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  Search,
  LayoutDashboard,
  CheckCircle2,
  Users,
  PieChart,
  User as UserIcon,
  Settings as SettingsIcon,
  Bell,
  Calendar,
  FileText,
  HelpCircle,
  MessageSquare,
  Moon,
  Plus,
  ArrowRight,
  Sparkles,
  X,
  Loader2,
  Shield,
  CornerDownLeft,
  Star,
  History,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { Task, User } from "@/types/auth";
import { toast } from "react-hot-toast";
import { filterFuzzy } from "@/lib/searchUtils";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";

interface CommandItem {
  id: string;
  category: "pages" | "tasks" | "team" | "actions" | "recent";
  title: string;
  subtitle?: string;
  icon: any;
  avatarUrl?: string;
  badge?: string;
  badgeColor?: string;
  onSelect: () => void;
}

interface GlobalCommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalCommandPalette = ({
  isOpen,
  onClose,
}: GlobalCommandPaletteProps) => {
  const { user } = useAuth();
  const router = useRouter();
  const isAdmin = user?.role === "admin";

  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "pages" | "tasks" | "team" | "actions">("all");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [savedSearches, setSavedSearches] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);
  const { recentItems } = useRecentlyViewed();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Dynamic remote results
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const resultsContainerRef = useRef<HTMLDivElement>(null);

  // Load saved searches from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem("nexus_saved_searches");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setSavedSearches(parsed);
      }
    } catch {}
  }, [isOpen]);

  const handleSaveSearch = (textToSave: string) => {
    const trimmed = textToSave.trim();
    if (!trimmed) return;
    const next = Array.from(new Set([trimmed, ...savedSearches])).slice(0, 8);
    setSavedSearches(next);
    try {
      localStorage.setItem("nexus_saved_searches", JSON.stringify(next));
    } catch {}
    toast.success(`Search "${trimmed}" saved!`);
  };

  const handleRemoveSavedSearch = (e: React.MouseEvent, textToRemove: string) => {
    e.stopPropagation();
    const next = savedSearches.filter((s) => s !== textToRemove);
    setSavedSearches(next);
    try {
      localStorage.setItem("nexus_saved_searches", JSON.stringify(next));
    } catch {}
  };

  // Auto-focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Fetch live tasks and users when query changes
  useEffect(() => {
    if (!isOpen) return;

    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setTasks([]);
      setUsers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timeoutId = setTimeout(async () => {
      try {
        const [taskRes, userRes] = await Promise.allSettled([
          api.get(`/tasks?search=${encodeURIComponent(trimmed)}`),
          api.get(`/users?includeAdmin=true`),
        ]);

        if (taskRes.status === "fulfilled" && taskRes.value.data?.data?.tasks) {
          setTasks(taskRes.value.data.data.tasks.slice(0, 6));
        } else {
          setTasks([]);
        }

        if (userRes.status === "fulfilled" && userRes.value.data?.data?.users) {
          const allUsers: User[] = userRes.value.data.data.users;
          const lowerQ = trimmed.toLowerCase();
          const matched = allUsers.filter((u) => {
            const fullName = `${u.firstName} ${u.lastName}`.toLowerCase();
            const email = (u.email || "").toLowerCase();
            const dept = (u.department || "").toLowerCase();
            const role = (u.role || "").toLowerCase();
            const empId = (u.employeeId || "").toLowerCase();
            return (
              fullName.includes(lowerQ) ||
              email.includes(lowerQ) ||
              dept.includes(lowerQ) ||
              role.includes(lowerQ) ||
              empId.includes(lowerQ)
            );
          });
          setUsers(matched.slice(0, 6));
        } else {
          setUsers([]);
        }
      } catch (err) {
        console.error("Failed to query global search", err);
      } finally {
        setLoading(false);
      }
    }, 220);

    return () => clearTimeout(timeoutId);
  }, [query, isOpen]);

  // Toggle Theme helper
  const handleToggleTheme = useCallback(() => {
    const currentTheme = localStorage.getItem("theme") || "light";
    const nextTheme = currentTheme === "dark" ? "light" : "dark";
    localStorage.setItem("theme", nextTheme);
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    window.dispatchEvent(new Event("theme-changed"));
    toast.success(`Theme switched to ${nextTheme} mode`);
    onClose();
  }, [onClose]);

  // Static Navigation Pages
  const pagesList: CommandItem[] = useMemo(() => {
    const list: CommandItem[] = [
      {
        id: "nav-dashboard",
        category: "pages",
        title: "Dashboard",
        subtitle: "Executive workspace metrics & activity overview",
        icon: LayoutDashboard,
        onSelect: () => {
          router.push("/dashboard");
          onClose();
        },
      },
      {
        id: "nav-tasks",
        category: "pages",
        title: "Tasks Board",
        subtitle: "Jira-style task deliverables, sprint boards & milestones",
        icon: CheckCircle2,
        onSelect: () => {
          router.push("/tasks");
          onClose();
        },
      },
      {
        id: "nav-analytics",
        category: "pages",
        title: "Analytics & Performance",
        subtitle: "Enterprise velocity, team workload & departmental reports",
        icon: PieChart,
        onSelect: () => {
          router.push("/analytics");
          onClose();
        },
      },
      {
        id: "nav-profile",
        category: "pages",
        title: "My Profile",
        subtitle: "Personal information, CTC structure & compliance records",
        icon: UserIcon,
        onSelect: () => {
          router.push("/profile");
          onClose();
        },
      },
      {
        id: "nav-settings",
        category: "pages",
        title: "Workspace Settings",
        subtitle: "System preferences, language, display scale & security",
        icon: SettingsIcon,
        onSelect: () => {
          router.push("/settings");
          onClose();
        },
      },
      {
        id: "nav-notifications",
        category: "pages",
        title: "Notifications & Activity Hub",
        subtitle: "Real-time task assignments, system alerts & updates",
        icon: Bell,
        onSelect: () => {
          router.push("/notifications");
          onClose();
        },
      },
      {
        id: "nav-calendar",
        category: "pages",
        title: "Company Calendar",
        subtitle: "Upcoming townhalls, deadlines & team sync events",
        icon: Calendar,
        onSelect: () => {
          router.push("/calendar");
          onClose();
        },
      },
      {
        id: "nav-payslips",
        category: "pages",
        title: "Payslips & Compensation",
        subtitle: "Download monthly salary slips & compensation breakdown",
        icon: FileText,
        onSelect: () => {
          router.push("/payslips");
          onClose();
        },
      },
      {
        id: "nav-help",
        category: "pages",
        title: "Help & Support Center",
        subtitle: "Frequently asked questions, system guides & documentation",
        icon: HelpCircle,
        onSelect: () => {
          router.push("/help");
          onClose();
        },
      },
      {
        id: "nav-hub",
        category: "pages",
        title: "Workspace Collaboration Hub",
        subtitle: "Company broadcasts, announcements & open discussions",
        icon: MessageSquare,
        onSelect: () => {
          router.push("/empty-states");
          onClose();
        },
      },
    ];

    if (isAdmin) {
      list.splice(2, 0, {
        id: "nav-employees",
        category: "pages",
        title: "Employees Directory",
        subtitle: "Staff governance, account status & administrative tools",
        icon: Users,
        onSelect: () => {
          router.push("/employees");
          onClose();
        },
      });
    }

    return list;
  }, [isAdmin, router, onClose]);

  // Quick Action Shortcuts
  const actionsList: CommandItem[] = useMemo(() => {
    return [
      {
        id: "act-new-task",
        category: "actions",
        title: "Create New Task",
        subtitle: "Open the deliverable creator to assign work",
        icon: Plus,
        badge: "Action",
        badgeColor: "bg-[#5B5FEF] text-white",
        onSelect: () => {
          router.push("/tasks?action=new");
          onClose();
        },
      },
      {
        id: "act-theme",
        category: "actions",
        title: "Toggle Dark / Light Theme",
        subtitle: "Switch appearance mode across the entire workspace",
        icon: Moon,
        badge: "Appearance",
        badgeColor: "bg-purple-600 text-white",
        onSelect: handleToggleTheme,
      },
      {
        id: "act-change-pass",
        category: "actions",
        title: "Change Account Password",
        subtitle: "Navigate to security settings to update credentials",
        icon: Shield,
        badge: "Security",
        badgeColor: "bg-emerald-600 text-white",
        onSelect: () => {
          router.push("/settings");
          onClose();
        },
      },
    ];
  }, [router, onClose, handleToggleTheme]);

  // Transform Tasks into Command Items
  const taskItems: CommandItem[] = useMemo(() => {
    return tasks.map((t) => {
      let badgeColor = "bg-slate-500 text-white";
      if (t.priority === "urgent") badgeColor = "bg-rose-500 text-white";
      else if (t.priority === "high") badgeColor = "bg-amber-500 text-white";
      else if (t.priority === "medium") badgeColor = "bg-blue-500 text-white";

      return {
        id: `task-${t._id}`,
        category: "tasks",
        title: t.title,
        subtitle: `${t.taskCode} • ${t.department || "General"} • Status: ${t.status.replace("_", " ").toUpperCase()}`,
        icon: CheckCircle2,
        badge: t.taskCode,
        badgeColor,
        onSelect: () => {
          router.push(`/tasks?search=${encodeURIComponent(t.taskCode)}`);
          onClose();
        },
      };
    });
  }, [tasks, router, onClose]);

  // Transform Users into Command Items
  const userItems: CommandItem[] = useMemo(() => {
    return users.map((u) => {
      const isUserAdmin = u.role === "admin";
      return {
        id: `user-${u._id}`,
        category: "team",
        title: `${u.firstName} ${u.lastName}`,
        subtitle: `${u.email} • ${u.role || "Employee"} • ${u.department || "Engineering"}`,
        icon: Users,
        avatarUrl: u.avatarUrl,
        badge: isUserAdmin ? "Admin" : u.employeeId || "Staff",
        badgeColor: isUserAdmin ? "bg-amber-500 text-white" : "bg-blue-500 text-white",
        onSelect: () => {
          if (isAdmin) {
            router.push(`/employees?search=${encodeURIComponent(u.firstName)}`);
          } else {
            router.push("/dashboard");
          }
          onClose();
        },
      };
    });
  }, [users, isAdmin, router, onClose]);

  // Transform Recently Viewed items into Command Items
  const recentCommandItems: CommandItem[] = useMemo(() => {
    return recentItems.map((r) => ({
      id: `recent-${r.id}`,
      category: "recent",
      title: r.title,
      subtitle: r.subtitle || `Visited ${r.badge || "item"}`,
      icon: History,
      badge: "Recent",
      badgeColor: "bg-indigo-500 text-white",
      onSelect: () => {
        router.push(r.href);
        onClose();
      },
    }));
  }, [recentItems, router, onClose]);

  // Combine & Filter Results with Smart Typo-Tolerant Fuzzy Search
  const filteredItems: CommandItem[] = useMemo(() => {
    const q = query.trim();

    // Fuzzy filter pages
    const matchedPages = q
      ? filterFuzzy(pagesList, q, (p) => [p.title, p.subtitle, p.category])
      : pagesList;

    // Fuzzy filter actions
    const matchedActions = q
      ? filterFuzzy(actionsList, q, (a) => [a.title, a.subtitle, a.category, a.badge])
      : actionsList;

    // Fuzzy filter tasks
    const matchedTasks = q
      ? filterFuzzy(taskItems, q, (t) => [t.title, t.subtitle, t.badge])
      : taskItems;

    // Fuzzy filter users
    const matchedUsers = q
      ? filterFuzzy(userItems, q, (u) => [u.title, u.subtitle, u.badge])
      : userItems;

    let combined: CommandItem[] = [];

    if (activeFilter === "all") {
      if (!q && recentCommandItems.length > 0) {
        // Show recently viewed items at top when query is empty
        combined = [
          ...recentCommandItems.slice(0, 3),
          ...matchedActions,
          ...matchedTasks,
          ...matchedUsers,
          ...matchedPages,
        ];
      } else {
        combined = [...matchedActions, ...matchedTasks, ...matchedUsers, ...matchedPages];
      }
    } else if (activeFilter === "pages") {
      combined = matchedPages;
    } else if (activeFilter === "tasks") {
      combined = matchedTasks;
    } else if (activeFilter === "team") {
      combined = matchedUsers;
    } else if (activeFilter === "actions") {
      combined = matchedActions;
    }

    return combined;
  }, [query, activeFilter, pagesList, actionsList, taskItems, userItems, recentCommandItems]);

  // Keep selected index within bounds
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredItems.length, query, activeFilter]);

  // Keyboard navigation inside modal
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].onSelect();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  // Scroll active item into view
  useEffect(() => {
    if (!resultsContainerRef.current) return;
    const activeEl = resultsContainerRef.current.querySelector(
      `[data-index="${selectedIndex}"]`
    ) as HTMLElement;
    if (activeEl) {
      activeEl.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-start justify-center p-3 sm:p-6 md:pt-20 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      {/* Dimmed Backdrop with Blur - Click anywhere outside to close */}
      <div
        className="fixed inset-0 bg-slate-950/60 dark:bg-black/80 backdrop-blur-sm transition-opacity cursor-pointer"
        onClick={onClose}
        title="Click anywhere outside to close search"
      />

      {/* Main Spotlight Modal Card */}
      <div
        className="relative w-full max-w-2xl glass-modal rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] border border-slate-200/90 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150"
        onKeyDown={handleKeyDown}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-100 dark:border-slate-800/80 gap-3">
          <Search className="w-5 h-5 text-[#5B5FEF] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks, team members, settings, or jump to page... (smart typo tolerance enabled)"
            className="flex-1 bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400 text-[14.5px] font-semibold outline-none border-none"
          />

          {loading && <Loader2 className="w-4 h-4 text-[#5B5FEF] animate-spin shrink-0" />}

          {/* Bookmark Current Query Button */}
          {query.trim().length > 1 && (
            <button
              type="button"
              onClick={() => handleSaveSearch(query)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors"
              title="Bookmark this search criteria"
            >
              <Star className={`w-4 h-4 ${savedSearches.includes(query.trim()) ? "fill-amber-400 text-amber-500" : ""}`} />
            </button>
          )}

          {/* Clear Query button if text exists */}
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Clear input text"
              aria-label="Clear input text"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Dedicated Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="group flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer shadow-2xs"
            title="Close search modal (Esc or click)"
            aria-label="Close search modal"
          >
            <X className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-white group-hover:rotate-90 transition-transform" />
            <span className="text-[11px] font-bold">Esc</span>
          </button>
        </div>

        {/* Saved Searches Row (when query is empty and saved searches exist) */}
        {!query && savedSearches.length > 0 && (
          <div className="flex items-center gap-1.5 px-4 py-2 border-b border-slate-100 dark:border-slate-800/80 bg-amber-50/40 dark:bg-amber-950/20 overflow-x-auto text-[11px] font-semibold">
            <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1 shrink-0 font-bold">
              <Star className="w-3 h-3 fill-amber-400" />
              Saved Searches:
            </span>
            {savedSearches.map((s) => (
              <div
                key={s}
                onClick={() => setQuery(s)}
                className="group flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-amber-200/80 dark:border-amber-900/60 text-slate-700 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-amber-900/40 cursor-pointer transition-colors shrink-0"
              >
                <span>{s}</span>
                <button
                  type="button"
                  onClick={(e) => handleRemoveSavedSearch(e, s)}
                  className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 transition-opacity ml-1"
                  title="Remove saved search"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Category Pills Filter */}
        <div className="flex items-center gap-1.5 px-4 py-2 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-900/60 overflow-x-auto text-[11.5px] font-bold">
          {[
            { id: "all", label: "All Results" },
            { id: "pages", label: "Pages" },
            { id: "tasks", label: "Tasks" },
            { id: "team", label: "Team" },
            { id: "actions", label: "Actions" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveFilter(cat.id as any)}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                activeFilter === cat.id
                  ? "bg-[#5B5FEF] text-white shadow-2xs"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-800"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search Results List */}
        <div
          ref={resultsContainerRef}
          className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar max-h-[440px]"
        >
          {filteredItems.length === 0 ? (
            <div className="py-14 text-center space-y-2">
              <Search className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
              <p className="text-[14px] font-bold text-slate-700 dark:text-slate-300">
                No results found for &quot;{query}&quot;
              </p>
              <p className="text-[12px] font-medium text-slate-400 max-w-sm mx-auto">
                Try searching for page titles like &quot;Tasks&quot;, member names like &quot;Anant&quot;, or task codes like &quot;TSK&quot;.
              </p>
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const Icon = item.icon;
              const isSelected = index === selectedIndex;

              return (
                <div
                  key={item.id}
                  data-index={index}
                  onClick={item.onSelect}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`group flex items-center justify-between px-3.5 py-2.5 rounded-xl cursor-pointer transition-all ${
                    isSelected
                      ? "bg-[#5B5FEF] text-white shadow-xs"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 overflow-hidden transition-colors ${
                        isSelected
                          ? "bg-white/20 text-white"
                          : "bg-slate-100 dark:bg-slate-800 text-[#5B5FEF] dark:text-indigo-400 group-hover:bg-[#EEF0FF] dark:group-hover:bg-slate-700"
                      }`}
                    >
                      {item.avatarUrl ? (
                        <img
                          src={item.avatarUrl}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Icon className="w-4 h-4" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[13.5px] font-extrabold truncate ${
                            isSelected ? "text-white" : "text-slate-900 dark:text-white"
                          }`}
                        >
                          {item.title}
                        </span>

                        {item.badge && (
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider shrink-0 ${
                              isSelected
                                ? "bg-white/25 text-white"
                                : item.badgeColor || "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>

                      {item.subtitle && (
                        <p
                          className={`text-[11.5px] truncate font-medium mt-0.5 ${
                            isSelected
                              ? "text-white/80"
                              : "text-slate-500 dark:text-slate-400"
                          }`}
                        >
                          {item.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 pl-2">
                    {isSelected ? (
                      <CornerDownLeft className="w-4 h-4 text-white/90" />
                    ) : (
                      <ArrowRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Helper Footer */}
        <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-900/80 flex items-center justify-between text-[11px] font-medium text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-[10px]">
                ↑
              </kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-[10px]">
                ↓
              </kbd>
              <span>Navigate</span>
            </span>

            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-[10px]">
                ↵
              </kbd>
              <span>Select</span>
            </span>

            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-300 border border-transparent hover:border-rose-200 dark:hover:border-rose-800/60 transition-all cursor-pointer"
              title="Close search modal"
            >
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-[10px]">
                Esc
              </kbd>
              <span>Close</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-[#5B5FEF] font-bold">
            <Sparkles className="w-3 h-3" />
            <span>EmpSphere Omnisearch</span>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
