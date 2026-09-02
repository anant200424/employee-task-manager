import { ReactNode } from "react";
import { ProtectedRoute } from "@/components/dashboard/ProtectedRoute";
import { Sidebar } from "@/components/dashboard/Sidebar";

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-[#F4F6FA] dark:bg-[#0B0F17] text-slate-800 dark:text-slate-200 relative transition-colors duration-300">
        <Sidebar />
        <div className="flex-1 overflow-x-hidden relative z-10">{children}</div>
      </div>
    </ProtectedRoute>
  );
}
