"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bell, ChevronDown, LogOut, User as UserIcon, Shield, Search } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface TopbarProps {
  title: string;
  subtitle?: string;
}

export const Topbar = ({ title, subtitle }: TopbarProps) => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const initials = user
    ? `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase()
    : "EM";

  return (
    <header className="flex items-center justify-between border-b border-slate-200/80 bg-white px-5 py-3.5 lg:px-8">
      {/* Title / Search */}
      <div>
        <h1 className="text-[20px] sm:text-[22px] font-bold text-[#0F172A] tracking-tight">
          {title}
        </h1>
        {subtitle && <p className="text-[13px] text-slate-500 font-normal">{subtitle}</p>}
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        {/* Department Badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200">
          <Shield className="w-3.5 h-3.5 text-[#4355CC]" />
          <span>{user?.department || "Engineering"}</span>
        </div>

        {/* Notifications */}
        <button
          className="relative rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#4355CC]" />
        </button>

        {/* User Dropdown */}
        <div ref={menuRef} className="relative">
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-2.5 rounded-xl py-1 pl-1.5 pr-2.5 hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all cursor-pointer"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1E293B] text-xs font-bold text-white shadow-sm">
              {initials}
            </span>
            <div className="hidden text-left sm:block">
              <span className="block text-[13px] font-semibold text-slate-800 leading-tight">
                {user ? `${user.firstName} ${user.lastName}` : "Employee"}
              </span>
              <span className="block text-[11px] text-slate-400 font-medium">
                {user?.role || "Software Engineer"}
              </span>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>

          {open && (
            <div className="absolute right-0 top-full z-30 mt-2 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-[0_10px_30px_rgba(15,23,42,0.1)] animate-in fade-in zoom-in-95">
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="text-[13px] font-bold text-slate-900">
                  {user ? `${user.firstName} ${user.lastName}` : ""}
                </p>
                <p className="text-[11.5px] text-slate-400 truncate">{user?.email}</p>
                <p className="mt-1 text-[11px] font-semibold text-[#4355CC] bg-blue-50 px-2 py-0.5 rounded-md inline-block">
                  ID: {user?.employeeId || "EMP-1042"}
                </p>
              </div>

              <button
                onClick={() => {
                  setOpen(false);
                  router.push("/profile");
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-medium text-slate-700 hover:bg-slate-50 cursor-pointer mt-1"
              >
                <UserIcon className="h-4 w-4 text-slate-400" /> My Profile
              </button>

              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-medium text-red-600 hover:bg-red-50 cursor-pointer"
              >
                <LogOut className="h-4 w-4 text-red-500" /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
