"use client";

import { ReactNode } from "react";
import { ProtectedRoute } from "@/components/dashboard/ProtectedRoute";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { GlobalKeyboardHandler } from "@/components/dashboard/GlobalKeyboardHandler";
import { useSidebar } from "@/context/SidebarContext";
import dynamic from "next/dynamic";

const OnboardingTour = dynamic(
  () => import("@/components/dashboard/OnboardingTour").then((mod) => mod.OnboardingTour),
  { ssr: false }
);
const KeyboardShortcutsModal = dynamic(
  () => import("@/components/dashboard/KeyboardShortcutsModal").then((mod) => mod.KeyboardShortcutsModal),
  { ssr: false }
);

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  const { isCollapsed } = useSidebar();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#F4F6FA] dark:bg-[#090D16] text-slate-800 dark:text-slate-200 relative transition-colors duration-300">
        <Sidebar />
        <div
          className={`min-w-0 transition-all duration-300 ease-in-out ${
            isCollapsed ? "lg:pl-[76px]" : "lg:pl-[275px]"
          }`}
        >
          {children}
        </div>
        <GlobalKeyboardHandler />
        <OnboardingTour />
        <KeyboardShortcutsModal />
      </div>
    </ProtectedRoute>
  );
}

