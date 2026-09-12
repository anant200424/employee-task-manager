"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isLoading && (!isAuthenticated || !user)) {
      router.replace("/login");
      const timer = setTimeout(() => {
        if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
          window.location.replace("/login");
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [mounted, isLoading, isAuthenticated, user, router]);

  // Security guard: If employee is blocked by admin, lock them out completely
  if (mounted && user?.isBlocked) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-6 text-white text-center">
        <div className="max-w-md w-full p-8 rounded-3xl bg-slate-900 border border-red-500/30 shadow-2xl space-y-6 animate-in zoom-in-95 duration-300">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500 mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white tracking-tight">Account Suspended</h2>
            <p className="text-sm text-slate-400">
              Your employee account has been deactivated by the system administrator. You cannot access tasks, workspace hubs, or company data while your account is suspended.
            </p>
            {user?.blockedReason && (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-900/40 text-xs text-red-300 font-medium">
                Reason: {user.blockedReason}
              </div>
            )}
          </div>
          <button
            onClick={async () => {
              await logout();
              if (typeof window !== "undefined") {
                window.location.replace("/login");
              }
            }}
            className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-extrabold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    );
  }

  // Prevent hydration mismatch & block unauthorized access: render loading / redirect state
  if (!mounted || isLoading || !isAuthenticated || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F4F6FA] dark:bg-[#0B0F17]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 rounded-full border-3 border-[#5B5FEF] border-t-transparent animate-spin" />
          <p className="text-xs font-bold text-slate-400 tracking-wider uppercase">
            {!mounted || isLoading ? "Loading Workspace..." : "Redirecting to login..."}
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
