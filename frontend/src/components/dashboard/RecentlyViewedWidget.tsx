"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { History, Clock, ArrowRight } from "lucide-react";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";

export const RecentlyViewedWidget = () => {
  const { recentItems, clearRecentItems } = useRecentlyViewed();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatRelativeTime = (ts: number) => {
    const diff = Math.floor((Date.now() - ts) / 1000);
    if (diff < 60) return "Just now";
    const mins = Math.floor(diff / 60);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-9 h-9 rounded-xl border border-slate-200/90 dark:border-slate-700/90 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all flex items-center justify-center shadow-2xs cursor-pointer group active:scale-95"
        title="Recently Viewed & History"
        aria-label="Recently Viewed"
      >
        <History className="w-4 h-4 group-hover:scale-105 transition-transform" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl glass-modal p-3 space-y-2 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#5B5FEF]" />
              <span className="text-[12.5px] font-extrabold text-slate-900 dark:text-white">
                Recently Viewed & Activity
              </span>
            </div>

            {recentItems.length > 0 && (
              <button
                type="button"
                onClick={clearRecentItems}
                className="text-[11px] font-semibold text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          <div className="max-h-72 overflow-y-auto space-y-1.5 custom-scrollbar">
            {recentItems.length === 0 ? (
              <div className="py-8 text-center space-y-1">
                <History className="w-6 h-6 mx-auto text-slate-300 dark:text-slate-600" />
                <p className="text-[12px] font-bold text-slate-600 dark:text-slate-400">
                  No recent activity yet
                </p>
                <p className="text-[11px] text-slate-400">
                  Pages and items you visit will appear here so you can jump right back.
                </p>
              </div>
            ) : (
              recentItems.map((item) => (
                <Link
                  key={`${item.id}-${item.timestamp}`}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group cursor-pointer"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-[13px] font-bold text-slate-800 dark:text-slate-200 group-hover:text-[#5B5FEF] transition-colors truncate">
                        {item.title}
                      </p>
                      {item.badge && (
                        <span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/60 text-[#5B5FEF] dark:text-indigo-400">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    {item.subtitle && (
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {item.subtitle}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="text-[10px] text-slate-400">
                      {formatRelativeTime(item.timestamp)}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-[#5B5FEF] group-hover:translate-x-0.5 transition-all" />
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
