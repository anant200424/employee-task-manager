"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";

export interface RecentlyViewedItem {
  id: string;
  type: "page" | "task" | "employee";
  title: string;
  subtitle?: string;
  href: string;
  timestamp: number;
  badge?: string;
}

const STORAGE_KEY = "nexus_recently_viewed";
const MAX_ITEMS = 8;

const PAGE_NAMES: Record<string, { title: string; subtitle: string }> = {
  "/dashboard": { title: "Dashboard", subtitle: "Executive Workspace Overview" },
  "/tasks": { title: "Tasks Board", subtitle: "Sprint Deliverables & Kanban" },
  "/employees": { title: "Employees", subtitle: "Staff Governance Directory" },
  "/superadmin": { title: "Super Admin Portal", subtitle: "Platform Governance & Directory" },
  "/analytics": { title: "Analytics", subtitle: "Enterprise Velocity & Reports" },
  "/calendar": { title: "Calendar", subtitle: "Townhalls & Team Syncs" },
  "/settings": { title: "Settings", subtitle: "System Preferences & Security" },
  "/profile": { title: "My Profile", subtitle: "Personal & Compensation Info" },
  "/notifications": { title: "Notifications", subtitle: "Activity Stream & Alerts" },
  "/payslips": { title: "Payslips", subtitle: "Salary Breakdown & Records" },
  "/help": { title: "Help Center", subtitle: "Documentation & FAQs" },
  "/empty-states": { title: "Collaboration Hub", subtitle: "Broadcasts & Discussion" },
};

export const useRecentlyViewed = () => {
  const pathname = usePathname();
  const [recentItems, setRecentItems] = useState<RecentlyViewedItem[]>([]);

  // Load from localStorage
  const loadItems = useCallback(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setRecentItems(parsed);
          return;
        }
      }
    } catch {}
    setRecentItems([]);
  }, []);

  useEffect(() => {
    loadItems();
    window.addEventListener("storage", loadItems);
    window.addEventListener("nexus-recent-updated", loadItems);
    return () => {
      window.removeEventListener("storage", loadItems);
      window.removeEventListener("nexus-recent-updated", loadItems);
    };
  }, [loadItems]);

  // Add item helper
  const addRecentItem = useCallback((item: Omit<RecentlyViewedItem, "timestamp">) => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      let current: RecentlyViewedItem[] = raw ? JSON.parse(raw) : [];

      // Filter out duplicate
      current = current.filter((i) => i.href !== item.href && i.id !== item.id);

      // Prepend new item
      const newItem: RecentlyViewedItem = {
        ...item,
        timestamp: Date.now(),
      };

      const updated = [newItem, ...current].slice(0, MAX_ITEMS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setRecentItems(updated);
      window.dispatchEvent(new Event("nexus-recent-updated"));
    } catch (e) {
      console.error("Failed to update recently viewed", e);
    }
  }, []);

  // Clear all
  const clearRecentItems = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setRecentItems([]);
    window.dispatchEvent(new Event("nexus-recent-updated"));
  }, []);

  // Track page navigation automatically
  useEffect(() => {
    if (!pathname) return;
    const pageMeta = PAGE_NAMES[pathname];
    if (pageMeta) {
      addRecentItem({
        id: `page-${pathname}`,
        type: "page",
        title: pageMeta.title,
        subtitle: pageMeta.subtitle,
        href: pathname,
        badge: "Page",
      });
    }
  }, [pathname, addRecentItem]);

  return { recentItems, addRecentItem, clearRecentItems };
};
