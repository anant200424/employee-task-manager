"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Bell,
  LogOut,
  PieChart,
  MessageSquare,
  CheckCircle2,
  Settings as SettingsIcon,
  ShieldCheck,
  ChevronRight,
  ChevronDown,
  User as UserIcon,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { BrandMark } from "@/components/auth/BrandMark";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useSidebar } from "@/context/SidebarContext";
import { SidebarSkeleton } from "@/components/ui/Skeleton";

interface NavItem {
  href: string;
  label: string;
  transKey: string;
  icon: any;
  iconColor?: string;
  adminOnly?: boolean;
  hasDropdown?: boolean;
}

interface NavGroup {
  title: string;
  titleKey: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    title: "Overview",
    titleKey: "overview",
    items: [
      { href: "/dashboard", label: "Dashboard", transKey: "dashboard", icon: LayoutDashboard, iconColor: "text-[#5B5FEF]" },
      { href: "/employees", label: "Employees", transKey: "employees", icon: Users, iconColor: "text-blue-500", adminOnly: true },
      { href: "/analytics", label: "Analytics", transKey: "analytics", icon: PieChart, iconColor: "text-purple-500" },
    ],
  },
  {
    title: "Workspace",
    titleKey: "workspace",
    items: [
      { href: "/tasks", label: "Tasks", transKey: "tasks", icon: CheckCircle2, iconColor: "text-[#5B5FEF]" },
      { href: "/notifications", label: "Notifications", transKey: "notifications", icon: Bell, iconColor: "text-amber-500" },
      { href: "/empty-states", label: "Workspace Hub", transKey: "workspace_hub", icon: MessageSquare, iconColor: "text-sky-500" },
    ],
  },
  {
    title: "System & Management",
    titleKey: "system_mgmt",
    items: [
      { href: "/profile", label: "Profile", transKey: "profile", icon: UserIcon, iconColor: "text-[#5B5FEF]", hasDropdown: true },
      { href: "/settings", label: "Settings", transKey: "settings", icon: SettingsIcon, iconColor: "text-slate-500" },
    ],
  },
];

export const Sidebar = () => {
  const pathname = usePathname();
  const { user, isLoading, logout } = useAuth();
  const { t } = useLanguage();
  const { isCollapsed, toggleSidebar } = useSidebar();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const initials = user
    ? `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase()
    : "EM";

  const isAdmin = user?.role === "admin";

  const filteredGroups = navGroups.map((group) => ({
    ...group,
    items: group.items.filter((item) => {
      if (item.adminOnly && !isAdmin) return false;
      return true;
    }),
  }));

  return (
    <aside
      className={`hidden lg:flex lg:flex-col lg:border-r lg:border-slate-200/80 dark:border-slate-800/80 bg-[#F8FAFC] dark:bg-[#0B0F17] justify-between shrink-0 h-screen sticky top-0 z-40 select-none transition-all duration-300 ease-in-out ${
        isCollapsed ? "lg:w-[76px]" : "lg:w-[275px]"
      }`}
    >
      {/* Scrollable Navigation Area */}
      <div
        className={`flex-1 overflow-y-auto custom-scrollbar ${
          isCollapsed ? "px-2 py-4 space-y-4" : "px-4 py-6 space-y-5"
        }`}
      >
        {/* Brand Header with Jira-Style Collapse/Expand Button */}
        {isCollapsed ? (
          <div className="flex flex-col items-center gap-3 pt-1 pb-2">
            {/* Mini Brand Mark Circles */}
            <Link
              href="/dashboard"
              className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:scale-105 transition-all"
              title="EmpSphere Dashboard"
            >
              <div className="w-4.5 h-4.5 rounded-full bg-[#1E293B] dark:bg-indigo-500" />
              <div className="w-4.5 h-4.5 rounded-full -ml-2 bg-[#4355CC] dark:bg-indigo-300 opacity-90 mix-blend-multiply" />
            </Link>

            {/* Jira-style Expand Button */}
            <div className="relative group">
              <button
                onClick={toggleSidebar}
                aria-label="Expand sidebar"
                className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:text-[#5B5FEF] bg-white dark:bg-slate-900 hover:bg-[#EEF0FF] dark:hover:bg-[#5B5FEF]/20 border border-slate-200/80 dark:border-slate-800 shadow-xs transition-all cursor-pointer"
              >
                <PanelLeftOpen className="w-4.5 h-4.5" />
              </button>

              {/* Jira Tooltip */}
              <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 hidden group-hover:flex flex-col items-start bg-[#181B20] text-white text-[11px] font-bold px-2.5 py-1.5 rounded-lg shadow-xl whitespace-nowrap z-50 pointer-events-none animate-in fade-in zoom-in-95 border border-slate-700/60">
                <span>{t("expand_sidebar", "Expand sidebar")}</span>
                <span className="text-[9.5px] text-slate-400 font-mono mt-0.5">Ctrl [</span>
              </div>
            </div>

            {/* Collapsed Admin Shield Icon */}
            {isAdmin && (
              <div
                title="Admin Portal"
                className="w-9 h-9 rounded-xl bg-gradient-to-r from-[#5B5FEF] to-[#4338CA] text-white flex items-center justify-center shadow-xs cursor-default"
              >
                <ShieldCheck className="w-4 h-4" />
              </div>
            )}
          </div>
        ) : (
          <div className="px-2 pt-1 pb-2 flex flex-col items-start gap-3">
            <div className="flex items-center justify-between w-full">
              <BrandMark variant="dark" />

              {/* Jira-Style Collapse Button */}
              <div className="relative group">
                <button
                  onClick={toggleSidebar}
                  aria-label="Collapse sidebar"
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-800 dark:hover:text-white bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/60 dark:border-slate-700/60 transition-all cursor-pointer"
                >
                  <PanelLeftClose className="w-4 h-4" />
                </button>

                {/* Jira Tooltip */}
                <div className="absolute right-0 top-full mt-2 hidden group-hover:flex flex-col items-start bg-[#181B20] text-white text-[11px] font-bold px-2.5 py-1.5 rounded-lg shadow-xl whitespace-nowrap z-50 pointer-events-none animate-in fade-in zoom-in-95 border border-slate-700/60">
                  <span>{t("collapse_sidebar", "Collapse sidebar")}</span>
                  <span className="text-[9.5px] text-slate-400 font-mono mt-0.5">Ctrl [</span>
                </div>
              </div>
            </div>

            {isAdmin && (
              <div className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#5B5FEF] to-[#4338CA] text-white rounded-xl shadow-xs w-full card-shimmer hover-shimmer cursor-default">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span className="text-[11px] font-black tracking-widest uppercase">
                  {t("admin_portal", "Admin Portal")}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Grouped Navigation Sections */}
        <div className="space-y-4">
          {filteredGroups.map((group, groupIdx) => (
            <div key={groupIdx} className="space-y-1.5">
              {/* Group Title (Only in Expanded mode) */}
              {!isCollapsed && (
                <p className="px-2 text-[10.5px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  {t(group.titleKey, group.title)}
                </p>
              )}

              {/* Group Enclosure Card Box */}
              <div
                className={`bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800/90 shadow-[0_2px_8px_rgba(0,0,0,0.03)] ${
                  isCollapsed
                    ? "rounded-2xl p-1 flex flex-col items-center gap-1.5"
                    : "rounded-[20px] p-1.5 space-y-1"
                }`}
              >
                {group.items.map((item, idx) => {
                  const active =
                    pathname === item.href ||
                    (item.href !== "/dashboard" && pathname.startsWith(item.href));
                  const Icon = item.icon;
                  const itemLabel = t(item.transKey, item.label);

                  if (isCollapsed) {
                    return (
                      <div key={item.label + idx} className="relative group w-full flex justify-center">
                        <Link
                          href={item.href}
                          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                            active
                              ? "bg-[#EEF0FF] dark:bg-[#5B5FEF]/20 text-[#5B5FEF] dark:text-[#818CF8] border border-[#5B5FEF]/30 shadow-xs"
                              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-[#5B5FEF]"
                          }`}
                        >
                          <Icon
                            className={`w-4.5 h-4.5 shrink-0 transition-colors ${
                              active
                                ? "text-[#5B5FEF] dark:text-[#818CF8]"
                                : item.iconColor || "text-slate-400 dark:text-slate-500"
                            }`}
                          />
                        </Link>

                        {/* Floating Tooltip in Collapsed Mode */}
                        <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center bg-[#181B20] text-white text-[12px] font-bold px-2.5 py-1.5 rounded-lg shadow-xl whitespace-nowrap z-50 pointer-events-none animate-in fade-in zoom-in-95 border border-slate-700/60">
                          {itemLabel}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={item.label + idx}
                      href={item.href}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[13.5px] font-bold transition-all group hover-shimmer ${
                        active
                          ? "bg-[#EEF0FF] dark:bg-[#5B5FEF]/20 text-[#5B5FEF] dark:text-[#818CF8] border border-[#5B5FEF]/30 shadow-xs"
                          : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 border border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          className={`w-4.5 h-4.5 shrink-0 transition-colors ${
                            active
                              ? "text-[#5B5FEF] dark:text-[#818CF8]"
                              : item.iconColor || "text-slate-400 dark:text-slate-500"
                          }`}
                        />
                        <span className="truncate">{itemLabel}</span>
                      </div>

                      {item.hasDropdown ? (
                        <ChevronDown
                          className={`w-4 h-4 transition-transform ${
                            active ? "text-[#5B5FEF]" : "text-slate-400 dark:text-slate-500"
                          }`}
                        />
                      ) : (
                        <ChevronRight
                          className={`w-4 h-4 transition-transform group-hover:translate-x-0.5 ${
                            active ? "text-[#5B5FEF]" : "text-slate-400 dark:text-slate-500"
                          }`}
                        />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Employee Workspace / User & Sign Out Card */}
      <div
        className={`border-t border-slate-200/60 dark:border-slate-800/60 bg-[#F8FAFC] dark:bg-[#0B0F17] ${
          isCollapsed ? "p-2 pt-2 pb-4 space-y-2 flex flex-col items-center" : "p-4 pt-1 pb-5 space-y-1.5"
        }`}
      >
        {!isCollapsed && (
          <p className="px-2 text-[10.5px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            {isAdmin ? t("system_admin", "System Administrator") : t("emp_workspace", "Employee Workspace")}
          </p>
        )}

        {isCollapsed ? (
          /* Collapsed User & Logout */
          <div className="flex flex-col items-center gap-2 w-full">
            {/* User Profile Avatar */}
            <div className="relative group">
              <Link
                href="/profile"
                className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-black shrink-0 overflow-hidden relative ring-2 ring-slate-100 dark:ring-slate-800 hover:scale-105 transition-transform"
              >
                {user?.avatarUrl ? (
                  <img
                    src={user?.avatarUrl}
                    alt={user?.firstName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-[#818CF8]">{initials}</span>
                )}
              </Link>
              {/* Tooltip */}
              <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 hidden group-hover:flex flex-col items-start bg-[#181B20] text-white text-[11px] font-bold px-2.5 py-1.5 rounded-lg shadow-xl whitespace-nowrap z-50 pointer-events-none border border-slate-700/60">
                <span>{user ? `${user.firstName} ${user.lastName}` : "Profile"}</span>
                <span className="text-[9.5px] text-slate-400 font-normal">{user?.role || "Employee"}</span>
              </div>
            </div>

            {/* Compact Logout Button */}
            <div className="relative group">
              <button
                onClick={handleLogout}
                aria-label="Sign out"
                className="w-10 h-10 rounded-xl border border-red-200/90 dark:border-red-900/50 bg-red-50/40 dark:bg-red-950/20 hover:bg-red-100/70 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 flex items-center justify-center transition-all cursor-pointer"
              >
                <LogOut className="w-4.5 h-4.5 text-red-500" />
              </button>
              {/* Tooltip */}
              <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center bg-[#181B20] text-white text-[11px] font-bold px-2.5 py-1.5 rounded-lg shadow-xl whitespace-nowrap z-50 pointer-events-none border border-slate-700/60">
                {t("sign_out", "Sign out")}
              </div>
            </div>
          </div>
        ) : (
          /* Expanded User & Logout Box */
          <div className="bg-white dark:bg-slate-900/90 rounded-[22px] border border-slate-200/90 dark:border-slate-800/90 p-2 shadow-[0_2px_8px_rgba(0,0,0,0.03)] space-y-2">
            {/* User Profile Info Card */}
            <Link
              href="/profile"
              className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-800 hover:border-[#5B5FEF]/40 transition-all cursor-pointer group hover-shimmer"
            >
              <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-black shrink-0 overflow-hidden relative ring-2 ring-slate-100 dark:ring-slate-800">
                {user?.avatarUrl ? (
                  <img
                    src={user?.avatarUrl}
                    alt={user?.firstName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-[#818CF8]">{initials}</span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                    {t("active_status", "Active")}
                  </span>
                </div>
                <p className="text-[13px] font-extrabold text-slate-900 dark:text-white truncate group-hover:text-[#5B5FEF] transition-colors leading-snug">
                  {user ? `${user.firstName} ${user.lastName}` : "Kishan Umar"}
                </p>
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  {user?.role || "Product Designer"}
                </p>
              </div>
            </Link>

            {/* Styled Sign Out Button with Arrow */}
            <button
              onClick={handleLogout}
              className="w-full py-2.5 px-3.5 rounded-xl border border-red-200/90 dark:border-red-900/50 bg-red-50/40 dark:bg-red-950/20 hover:bg-red-100/70 dark:hover:bg-red-900/40 flex items-center justify-between transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <LogOut className="w-4 h-4 shrink-0 text-red-500" />
                <span className="text-[13px] font-extrabold">{t("sign_out", "Sign out")}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-red-400 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
