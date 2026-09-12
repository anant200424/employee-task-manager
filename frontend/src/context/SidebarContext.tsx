"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface SidebarContextType {
  isCollapsed: boolean;
  toggleSidebar: () => void;
  setCollapsed: (collapsed: boolean) => void;
  isMobileOpen: boolean;
  toggleMobileSidebar: () => void;
  setMobileOpen: (open: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const SidebarProvider = ({ children }: { children: ReactNode }) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const behavior = localStorage.getItem("sidebarBehavior");
    const saved = localStorage.getItem("sidebar_collapsed");
    if (behavior === "Collapsed" || saved === "true") {
      setIsCollapsed(true);
    } else if (behavior === "Expanded") {
      setIsCollapsed(false);
    }

    const handleBehaviorChange = () => {
      const b = localStorage.getItem("sidebarBehavior");
      if (b === "Collapsed") {
        setIsCollapsed(true);
      } else if (b === "Expanded") {
        setIsCollapsed(false);
      }
    };

    window.addEventListener("sidebar-behavior-change", handleBehaviorChange);
    return () => window.removeEventListener("sidebar-behavior-change", handleBehaviorChange);
  }, []);

  const toggleSidebar = () => {
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setIsMobileOpen((prev) => !prev);
    } else {
      setIsCollapsed((prev) => {
        const next = !prev;
        localStorage.setItem("sidebar_collapsed", String(next));
        return next;
      });
    }
  };

  const toggleMobileSidebar = () => {
    setIsMobileOpen((prev) => !prev);
  };

  const setCollapsed = (collapsed: boolean) => {
    setIsCollapsed(collapsed);
    localStorage.setItem("sidebar_collapsed", String(collapsed));
  };

  const setMobileOpen = (open: boolean) => {
    setIsMobileOpen(open);
  };

  // Keyboard shortcut listener: Ctrl + [ (or Cmd + [)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "[") {
        e.preventDefault();
        toggleSidebar();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <SidebarContext.Provider
      value={{
        isCollapsed: isMounted ? isCollapsed : false,
        toggleSidebar,
        setCollapsed,
        isMobileOpen,
        toggleMobileSidebar,
        setMobileOpen,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = (): SidebarContextType => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};
