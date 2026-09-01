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
  Moon // Added theme icons
} from "lucide-react";
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
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const savedTheme = (localStorage.getItem("theme") as "light" | "dark") || "light";
    setTheme(savedTheme);
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setOpen(false);
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
    <header className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/50 bg-white/60 backdrop-blur-xl px-8 py-5 gap-4 sticky top-0 z-40">
      {/* Title */}
      <div>
        <h1 className="text-[24px] font-extrabold text-[#0F172A] tracking-tight leading-none mb-1.5">
          {title}
        </h1>
        {subtitle && (
          <p className="text-[14px] text-slate-500 font-medium">{subtitle}</p>
        )}
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-5">
        {/* Search */}
        <div className="hidden md:flex items-center relative">
           <Search className="w-4 h-4 text-slate-400 absolute left-3" />
           <input 
             type="text" 
             placeholder="Search" 
             className="pl-9 pr-14 py-2 w-[240px] rounded-xl border border-slate-200 text-[13px] font-medium placeholder:text-slate-400 focus:outline-none focus:border-[#5B5FEF] focus:ring-1 focus:ring-[#5B5FEF] transition-all"
           />
           <div className="absolute right-2 text-[10px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
             Cmd+K
           </div>
        </div>

        <div className="flex items-center gap-3 border-r border-slate-200 pr-5">
          {/* Theme Toggle (Dark/Light mode) */}
          <button
            onClick={toggleTheme}
            className="relative rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer"
            aria-label="Toggle Theme"
          >
            {theme === "dark" ? <Sun className="h-5 w-5 text-amber-500" /> : <Moon className="h-5 w-5 text-slate-500" />}
          </button>

          {/* Notifications */}
          <button
            onClick={() => router.push("/notifications")}
            className="relative rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 border border-white" />
          </button>
          
          {/* Chat */}
          <button
            onClick={() => router.push("/empty-states")}
            className="hidden sm:block relative rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer"
            aria-label="Messages"
          >
            <MessageSquare className="h-5 w-5" />
          </button>

          {/* Help */}
          <button
            onClick={() => router.push("/help")}
            className="hidden sm:block relative rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer"
            aria-label="Help"
          >
            <HelpCircle className="h-5 w-5" />
          </button>
        </div>

        {/* User Dropdown */}
        <div ref={menuRef} className="relative">
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-2 rounded-full border border-transparent hover:border-slate-200 transition-all cursor-pointer"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1E293B] text-xs font-bold text-white overflow-hidden">
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
            <div className="absolute right-0 top-full z-30 mt-2 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-[0_10px_30px_rgba(15,23,42,0.1)] animate-in fade-in zoom-in-95">
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="text-[13px] font-bold text-slate-900">
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
