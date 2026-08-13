"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, CheckSquare, Users, User, LogOut, ShieldCheck } from "lucide-react";
import { BrandMark } from "@/components/auth/BrandMark";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard", label: "Task Manager", icon: CheckSquare },
  { href: "/profile", label: "My Profile", icon: User },
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

  return (
    <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-slate-200/80 lg:bg-white lg:py-6 justify-between shrink-0 min-h-screen">
      <div>
        {/* Brand Header */}
        <div className="px-6 pb-6 border-b border-slate-100 flex items-center justify-between">
          <BrandMark variant="dark" />
          <span className="px-2 py-0.5 rounded-full bg-blue-50 text-[10px] font-bold text-[#4355CC]">
            PRO
          </span>
        </div>

        {/* Navigation */}
        <div className="px-4 py-6">
          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">
            Main Menu
          </p>
          <nav className="space-y-1.5">
            {navItems.map((item, idx) => {
              const active = pathname === item.href && idx === 0;
              return (
                <Link
                  key={item.label + idx}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13.5px] font-semibold transition-all ${
                    active
                      ? "bg-[#4355CC] text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <item.icon className="h-4.5 w-4.5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Footer User Info & Logout */}
      <div className="px-4 pt-4 border-t border-slate-100 space-y-3">
        {/* User Badge */}
        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
          <div className="w-9 h-9 rounded-full bg-[#1E293B] text-white flex items-center justify-center text-xs font-bold shrink-0">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-slate-800 truncate">
              {user ? `${user.firstName} ${user.lastName}` : "Employee"}
            </p>
            <p className="text-[11px] font-medium text-slate-400 truncate">
              {user?.employeeId || "EMP-1042"} • {user?.department || "Engineering"}
            </p>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-[13px] font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
};
