"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

export default function RootPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const target = isAuthenticated ? "/dashboard" : "/home";
    if (!isLoading) {
      router.replace(target);
      const timer = setTimeout(() => {
        if (typeof window !== "undefined" && window.location.pathname === "/") {
          window.location.href = target;
        }
      }, 200);
      return () => clearTimeout(timer);
    } else {
      // Fallback timeout in case auth check takes long
      const safetyTimer = setTimeout(() => {
        if (typeof window !== "undefined" && window.location.pathname === "/") {
          window.location.href = "/home";
        }
      }, 1000);
      return () => clearTimeout(safetyTimer);
    }
  }, [isAuthenticated, isLoading, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F4F6FA] dark:bg-[#0B0F17]">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-7 w-7 animate-spin text-[#5B5FEF]" />
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Loading EmpSphere...
        </p>
      </div>
    </div>
  );
}
