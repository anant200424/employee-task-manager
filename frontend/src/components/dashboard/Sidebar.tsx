"use client";

import { useState, useEffect } from "react";
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
  Shield,
  ShieldCheck,
  ShieldAlert,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  User as UserIcon,
  Calendar,
  X,
} from "lucide-react";
import { BrandMark } from "@/components/auth/BrandMark";
import { useAuth } from "@/context/AuthContext";
import { isSuperAdminUser, isAdminUser } from "@/lib/roleUtils";
import { useLanguage } from "@/context/LanguageContext";
import { useSidebar } from "@/context/SidebarContext";

interface NavItem {
  href: string;
  label: string;
  transKey: string;
  icon: any;
  iconColor?: string;
  adminOnly?: boolean;
  employeeOnly?: boolean;
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
      { href: "/calendar", label: "Calendar", transKey: "calendar", icon: Calendar, iconColor: "text-emerald-500", employeeOnly: true },
      { href: "/notifications", label: "Notifications", transKey: "notifications", icon: Bell, iconColor: "text-amber-500" },
      { href: "/workspace-hub", label: "Workspace Hub", transKey: "workspace_hub", icon: MessageSquare, iconColor: "text-sky-500" },
    ],
  },
  {
    title: "System & Management",
    titleKey: "system_mgmt",
    items: [
      { href: "/audit", label: "Audit Logs", transKey: "audit_logs", icon: ShieldAlert, iconColor: "text-rose-500", adminOnly: true },
      { href: "/profile", label: "Profile", transKey: "profile", icon: UserIcon, iconColor: "text-[#5B5FEF]", hasDropdown: true },
      { href: "/settings", label: "Settings", transKey: "settings", icon: SettingsIcon, iconColor: "text-slate-500" },
    ],
  },
];

export const Sidebar = () => {
  const pathname = usePathname();
  const { user, isLoading, logout } = useAuth();
  const { t } = useLanguage();
  const { isCollapsed, toggleSidebar, isMobileOpen, setMobileOpen } = useSidebar();
  const router = useRouter();

  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const saved = localStorage.getItem("sidebar_collapsed_groups");
      if (saved) {
        setCollapsedGroups(JSON.parse(saved));
      }
    } catch {}
  }, []);

  const toggleGroupCollapse = (groupKey: string) => {
    setCollapsedGroups((prev) => {
      const next = { ...prev, [groupKey]: !prev[groupKey] };
      try {
        localStorage.setItem("sidebar_collapsed_groups", JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Automatically close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Prevent background scrolling on mobile when drawer is open
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileOpen]);

  const handleLogout = async () => {
    setMobileOpen(false);
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

  const initials = user
    ? `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase()
    : "EM";

  const isSuperAdmin = isSuperAdminUser(user);
  const isAdmin = isAdminUser(user);

  const filteredGroups = navGroups.map((group) => ({
    ...group,
    items: group.items
      .filter((item) => {
        if (item.adminOnly && !isAdmin) return false;
        if (item.employeeOnly && isAdmin) return false;
        return true;
      })
      .map((item) => {
        if (item.href === "/employees") {
          if (isSuperAdmin) {
            return {
              ...item,
              label: "Super Admin Portal",
              transKey: "superadmin_portal",
              href: "/superadmin",
            };
          }
          if (isAdmin) {
            return {
              ...item,
              label: "Admin Portal",
              transKey: "admin_portal",
              href: "/admin",
            };
          }
        }
        return item;
      }),
  }));

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 lg:hidden animate-in fade-in duration-200"
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 h-full max-h-screen lg:h-screen flex flex-col justify-between border-r border-slate-200/80 dark:border-[#1A2234] bg-[#F8FAFC] dark:bg-[#0B0F18] shrink-0 select-none overflow-hidden transition-all duration-300 ease-in-out w-[285px] max-w-[85vw] ${
          isMobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0"
        } ${isCollapsed ? "lg:w-[76px]" : "lg:w-[275px]"}`}
      >
        {/* SECTION 1: HEADER (shrink-0) */}
        <div
          className={`shrink-0 border-b border-slate-200/60 dark:border-slate-800/60 ${
            isCollapsed ? "p-3 flex flex-col items-center gap-3" : "px-4 pt-3.5 pb-3 flex flex-col items-start gap-2.5"
          }`}
        >
          {isCollapsed ? (
            <div className="flex flex-col items-center gap-3">
              {/* Mini Brand Mark Circles */}
              <Link
                href="/dashboard"
                className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:scale-105 transition-all"
                title="EmpSphere Dashboard"
              >
                <div className="w-4.5 h-4.5 rounded-full bg-[#1E293B] dark:bg-indigo-500" />
                <div className="w-4.5 h-4.5 rounded-full -ml-2 bg-[#4355CC] dark:bg-indigo-300 opacity-90 mix-blend-multiply" />
              </Link>

              {/* Collapsed Role Shield Icon */}
              {isSuperAdmin ? (
                <div
                  title="Super Admin Portal (Root Governance)"
                  className="w-9 h-9 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-700 text-white flex items-center justify-center shadow-xs cursor-default"
                >
                  <Shield className="w-4 h-4 text-amber-300" />
                </div>
              ) : isAdmin ? (
                <div
                  title="Admin Portal"
                  className="w-9 h-9 rounded-xl bg-gradient-to-r from-[#5B5FEF] to-[#4338CA] text-white flex items-center justify-center shadow-xs cursor-default"
                >
                  <ShieldCheck className="w-4 h-4" />
                </div>
              ) : null}
            </div>
          ) : (
            <div className="w-full space-y-2">
              <div className="flex items-center justify-between w-full">
                <Link
                  href="/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className="hover:opacity-90 transition-opacity"
                  title="EmpSphere Dashboard"
                >
                  <BrandMark variant="dark" />
                </Link>

                <div className="flex items-center gap-2">
                  {/* Mobile-Only Direct Sign Out Button */}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="lg:hidden px-2.5 py-1.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200/90 dark:border-red-900/50 hover:bg-red-100 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 font-extrabold text-[11.5px] flex items-center gap-1.5 shrink-0 transition-all cursor-pointer active:scale-95 shadow-2xs"
                    title={t("sign_out", "Sign out")}
                  >
                    <LogOut className="w-3.5 h-3.5 text-red-500" />
                    <span>{t("sign_out", "Sign out")}</span>
                  </button>

                  {/* Mobile Close Button (X) */}
                  <button
                    type="button"
                    onClick={() => setMobileOpen(false)}
                    className="lg:hidden w-8 h-8 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-200/60 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                    aria-label="Close menu"
                    title="Close menu"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Desktop-Only Role Badge */}
              <div className="hidden lg:flex items-center">
                {isSuperAdmin ? (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800/60 rounded-lg shadow-2xs cursor-default">
                    <Shield className="w-3 h-3 text-amber-400" />
                    <span className="text-[10px] font-black tracking-wider uppercase">
                      {t("superadmin_portal", "Super Admin")}
                    </span>
                  </div>
                ) : isAdmin ? (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[#EEF0FF] dark:bg-[#5B5FEF]/20 text-[#5B5FEF] dark:text-indigo-300 border border-[#5B5FEF]/30 dark:border-indigo-800/60 rounded-lg shadow-2xs cursor-default">
                    <ShieldCheck className="w-3 h-3 text-[#5B5FEF]" />
                    <span className="text-[10px] font-black tracking-wider uppercase">
                      {t("admin_portal", "Admin Portal")}
                    </span>
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </div>

        {/* SECTION 2: MIDDLE SCROLLABLE NAVIGATION (flex-1 min-h-0 overflow-y-auto) */}
        <div
          className={`flex-1 min-h-0 overflow-y-auto custom-scrollbar ${
            isCollapsed ? "px-2 py-3 space-y-4" : "px-3.5 sm:px-4 py-3 space-y-3.5"
          }`}
        >
          {filteredGroups.map((group, groupIdx) => {
            const isGroupCollapsed = !!collapsedGroups[group.titleKey];

            return (
              <div key={groupIdx} className="space-y-1">
                {/* Group Title with Upward Collapse Option (^) */}
                {!isCollapsed && (
                  <button
                    type="button"
                    onClick={() => toggleGroupCollapse(group.titleKey)}
                    aria-expanded={!isGroupCollapsed}
                    className="w-full flex items-center justify-between px-2 py-1 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-all cursor-pointer group select-none text-left"
                    title={
                      isGroupCollapsed
                        ? t("expand_section", "Expand section")
                        : t("collapse_section_up", "Collapse section upwards")
                    }
                  >
                    <span className="text-[10.5px] font-extrabold text-slate-400 group-hover:text-slate-700 dark:text-slate-500 dark:group-hover:text-slate-300 uppercase tracking-widest transition-colors">
                      {t(group.titleKey, group.title)}
                    </span>

                    <div className="w-4 h-4 rounded-md flex items-center justify-center text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors shrink-0">
                      {isGroupCollapsed ? (
                        <ChevronDown className="w-3.5 h-3.5 transition-transform duration-200" />
                      ) : (
                        <ChevronUp className="w-3.5 h-3.5 transition-transform duration-200" />
                      )}
                    </div>
                  </button>
                )}

                {/* Group Enclosure Card Box */}
                <div
                  className={`transition-all duration-300 ease-in-out overflow-hidden ${
                    !isCollapsed && isGroupCollapsed
                      ? "max-h-0 opacity-0 pointer-events-none mt-0"
                      : "max-h-[600px] opacity-100"
                  }`}
                >
                  <div
                    className={`bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800/90 shadow-[0_2px_8px_rgba(0,0,0,0.03)] ${
                      isCollapsed
                        ? "rounded-2xl p-1 flex flex-col items-center gap-1.5"
                        : "rounded-[18px] p-1 space-y-0.5"
                    }`}
                  >
                    {group.items.map((item, idx) => {
                      const active =
                        pathname === item.href ||
                        (item.href !== "/dashboard" && pathname.startsWith(item.href)) ||
                        ((item.href === "/superadmin" || item.href === "/admin" || item.href === "/employees") &&
                          (pathname === "/superadmin" || pathname === "/admin" || pathname === "/employees")) ||
                        ((item.href === "/workspace-hub" || item.href === "/empty-states") &&
                          (pathname === "/workspace-hub" || pathname === "/empty-states"));
                      const Icon = item.icon;
                      const itemLabel = t(item.transKey, item.label);

                      if (isCollapsed) {
                        return (
                          <div key={item.label + idx} className="relative group w-full flex justify-center">
                            <Link
                              href={item.href}
                              onClick={() => setMobileOpen(false)}
                              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                                active
                                  ? "bg-[#EEF0FF] dark:bg-[#5B5FEF] text-[#5B5FEF] dark:text-white border border-[#5B5FEF]/30 dark:border-transparent shadow-xs dark:shadow-[0_4px_16px_rgba(91,95,239,0.45)]"
                                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#161D2C] hover:text-[#5B5FEF] dark:hover:text-white"
                              }`}
                            >
                              <Icon
                                className={`w-4.5 h-4.5 shrink-0 transition-colors ${
                                  active
                                    ? "text-[#5B5FEF] dark:text-white"
                                    : item.iconColor || "text-slate-400 dark:text-slate-500"
                                }`}
                              />
                            </Link>

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
                          onClick={() => setMobileOpen(false)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[13px] font-bold transition-all group hover-shimmer ${
                            active
                              ? "bg-[#EEF0FF] dark:bg-[#5B5FEF] text-[#5B5FEF] dark:text-white border border-[#5B5FEF]/30 dark:border-transparent shadow-xs dark:shadow-[0_4px_16px_rgba(91,95,239,0.45)]"
                              : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#161D2C] dark:hover:text-white border border-transparent"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <Icon
                              className={`w-4 h-4 shrink-0 transition-colors ${
                                active
                                  ? "text-[#5B5FEF] dark:text-white"
                                  : item.iconColor || "text-slate-400 dark:text-slate-500"
                              }`}
                            />
                            <span className="truncate">{itemLabel}</span>
                          </div>

                          {item.hasDropdown ? (
                            <ChevronDown
                              className={`w-3.5 h-3.5 transition-transform ${
                                active ? "text-[#5B5FEF] dark:text-white" : "text-slate-400 dark:text-slate-500"
                              }`}
                            />
                          ) : (
                            <ChevronRight
                              className={`w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 ${
                                active ? "text-[#5B5FEF] dark:text-white" : "text-slate-400 dark:text-slate-500"
                              }`}
                            />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}

        </div>

        {/* SECTION 3: PINNED BOTTOM USER PROFILE & SIGN OUT CARD */}
        <div
          className={`shrink-0 border-t border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0B0F18] ${
            isCollapsed
              ? "p-2 pt-2.5 pb-3.5 space-y-2 flex flex-col items-center"
              : "p-2.5 sm:p-3 pb-[max(0.6rem,env(safe-area-inset-bottom))]"
          }`}
        >
          {isCollapsed ? (
            /* Collapsed User & Logout */
            <div className="flex flex-col items-center gap-2 w-full">
              <div className="relative group">
                <Link
                  href="/profile"
                  onClick={() => setMobileOpen(false)}
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
                <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 hidden group-hover:flex flex-col items-start bg-[#181B20] text-white text-[11px] font-bold px-2.5 py-1.5 rounded-lg shadow-xl whitespace-nowrap z-50 pointer-events-none border border-slate-700/60">
                  <span>{user ? `${user.firstName} ${user.lastName}` : "Profile"}</span>
                  <span className="text-[9.5px] text-slate-400 font-normal">{user?.role || "Employee"}</span>
                </div>
              </div>

              <div className="relative group">
                <button
                  onClick={handleLogout}
                  aria-label="Sign out"
                  className="w-10 h-10 rounded-xl border border-red-200/90 dark:border-red-900/50 bg-red-50/40 dark:bg-red-950/20 hover:bg-red-100/70 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 flex items-center justify-center transition-all cursor-pointer"
                >
                  <LogOut className="w-4.5 h-4.5 text-red-500" />
                </button>
                <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center bg-[#181B20] text-white text-[11px] font-bold px-2.5 py-1.5 rounded-lg shadow-xl whitespace-nowrap z-50 pointer-events-none border border-slate-700/60">
                  {t("sign_out", "Sign out")}
                </div>
              </div>
            </div>
          ) : (
            /* Compact Pinned User & Sign Out Row (Fits on ALL phone heights) */
            <div className="rounded-xl border border-slate-200/90 dark:border-slate-800/90 bg-slate-50/80 dark:bg-slate-900/90 p-2 shadow-2xs">
              <div className="flex items-center justify-between gap-2">
                {/* User Profile Info */}
                <Link
                  href="/profile"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 min-w-0 flex-1 group cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-black shrink-0 overflow-hidden ring-1 ring-slate-200 dark:ring-slate-700">
                    {user?.avatarUrl ? (
                      <img
                        src={user?.avatarUrl}
                        alt={user?.firstName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-[#818CF8] text-[11px]">{initials}</span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-extrabold text-slate-900 dark:text-white truncate group-hover:text-[#5B5FEF] transition-colors leading-tight">
                      {user ? `${user.firstName} ${user.lastName}` : (isAdmin ? "Administrator" : "Team Member")}
                    </p>
                    <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate">
                      {user?.employmentInfo?.designation || user?.role || (isAdmin ? "Administrator" : "Employee")}
                    </p>
                  </div>
                </Link>

                {/* Bottom Sign Out Button */}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-2.5 py-1.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200/90 dark:border-red-900/50 hover:bg-red-100 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 font-extrabold text-[11.5px] flex items-center gap-1.5 shrink-0 transition-all cursor-pointer active:scale-95 shadow-2xs"
                  title={t("sign_out", "Sign out")}
                >
                  <LogOut className="w-3.5 h-3.5 text-red-500" />
                  <span>{t("sign_out", "Sign out")}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
