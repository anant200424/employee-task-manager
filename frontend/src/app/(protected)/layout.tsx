"use client";

import { ReactNode } from "react";
import { ProtectedRoute } from "@/components/dashboard/ProtectedRoute";
import { Sidebar } from "@/components/dashboard/Sidebar";

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-[#F8FAFC]">
        <Sidebar />
        <div className="flex-1 overflow-x-hidden">{children}</div>
      </div>
    </ProtectedRoute>
  );
}
