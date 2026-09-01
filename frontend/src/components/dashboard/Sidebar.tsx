"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Calendar,
  LogOut,
  Bell,
  FileText,
  ClipboardList,
  CreditCard,
  PieChart,
  MessageSquare,
  Settings as SettingsIcon // Added SettingsIcon
} from "lucide-react";
import { BrandMark } from "@/components/auth/BrandMark";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

const navGroups = [
  {
    title: "Overview",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/analytics", label: "Analytics", icon: PieChart },
    ]
  },
  {
    title: "Workspace & Comms",
    items: [
      { href: "/empty-states", label: "Workspace Hub", icon: MessageSquare },
      { href: "/calendar", label: "Calendar", icon: Calendar },
      { href: "/events", label: "Events", icon: FileText },
      { href: "/attendance", label: "Attendance", icon: ClipboardList },
    ]
  },
  {
    title: "System & Management",
    items: [
      { href: "/profile", label: "Profile", icon: Users, hasDropdown: true },
      { href: "/users", label: "Users", icon: Users },
      { href: "/settings", label: "Settings", icon: SettingsIcon },
    ]
  }
];

export const Sidebar = () => {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const initials = user
    ? `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase()
    : "EM";

  const isAdmin = user?.role === "admin";
  const filteredGroups = navGroups.map(group => ({
    ...group,
    items: group.items.filter(item => {
      if (item.label === "Users" && !isAdmin) return false;
      return true;
    })
  }));

  return (
    <aside className="hidden lg:flex lg:w-[260px] lg:flex-col lg:border-r lg:border-slate-200/50 dark:border-slate-800 bg-gradient-to-b from-[#F6F8FF] to-[#FFFFFF] dark:from-[#0F172A] dark:to-[#0B1120] justify-between shrink-0 h-screen sticky top-0 z-40 shadow-sm transition-colors duration-300">
      <div className="flex-1 overflow-y-auto custom-scrollbar pb-6">
        {/* Brand Header */}
        <div className="px-6 py-8 flex items-center justify-between">
          <BrandMark variant="dark" />
        </div>

        {/* Navigation Groups */}
        <div className="px-4 pb-2 space-y-6">
          {filteredGroups.map((group, groupIdx) => (
            <div key={groupIdx}>
              <p className="px-3 text-[11px] font-bold text-slate-500 mb-3 uppercase tracking-wider">
                {group.title}
              </p>
              <nav className="space-y-1">
                {group.items.map((item, idx) => {
                  const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.label + idx}
                      href={item.href}
                      className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-[14px] font-semibold transition-all ${
                        active
                          ? "bg-[#EEF0FF] text-[#5B5FEF] shadow-sm dark:bg-[#5B5FEF]/20 dark:text-[#818CF8]"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`h-4.5 w-4.5 ${active ? "text-[#5B5FEF] dark:text-[#818CF8]" : "text-slate-400"}`} />
                        {item.label}
                      </div>
                      {item.hasDropdown && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
                          <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>


       

      </div>

      {/* Footer User Info & Logout */}
      <div className="p-4 border-t border-slate-200/30">
        <p className="px-3 text-[12px] font-semibold text-slate-500 mb-3">
          Premium employee profile
        </p>
        <div className="flex flex-col gap-2 p-3 rounded-2xl bg-white border border-slate-100 shadow-sm relative group">
          <div className="flex items-center gap-3 w-full">
            <div className="w-10 h-10 rounded-full bg-[#1E293B] text-white flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden relative">
              {user?.avatarUrl ? (
                <img
                  src={user?.avatarUrl}
                  alt={user?.firstName}
                  className="h-full w-full object-cover"
                />
              ) : (
                initials
              )}
              {/* Online indicator */}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mb-0.5" />
                 <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Online</span>
              </div>
              <p className="text-[13px] font-bold text-slate-900 truncate flex items-center justify-between w-full pr-1">
                {user ? `${user.firstName} ${user.lastName}` : "Employee Name"}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
                    <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </p>
              <p className="text-[11px] font-medium text-slate-500 truncate mt-0.5">
                {user?.role || "Software Developer"}
              </p>
            </div>
          </div>
          
          {/* Logout Button (Appears on hover) */}
          <div className="absolute inset-0 bg-white/95 backdrop-blur-sm rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 border border-slate-100">
             <button
              onClick={handleLogout}
              className="flex w-full h-full items-center justify-center gap-2 rounded-2xl text-[13px] font-bold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
