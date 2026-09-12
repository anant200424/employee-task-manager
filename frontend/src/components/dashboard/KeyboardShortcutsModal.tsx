"use client";

import { useState, useEffect } from "react";
import { X, Keyboard } from "lucide-react";

export const KeyboardShortcutsModal = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    const handleClose = () => setIsOpen(false);

    window.addEventListener("nexus-open-shortcuts", handleOpen);
    window.addEventListener("nexus-close-modals", handleClose);

    return () => {
      window.removeEventListener("nexus-open-shortcuts", handleOpen);
      window.removeEventListener("nexus-close-modals", handleClose);
    };
  }, []);

  if (!isOpen) return null;

  const shortcutGroups = [
    {
      title: "Global & Search",
      items: [
        { keys: ["Ctrl", "K"], description: "Open Command Palette / Omnisearch" },
        { keys: ["/"], description: "Quick focus search bar" },
        { keys: ["?"], description: "Open Keyboard Shortcuts Help" },
        { keys: ["Esc"], description: "Close any modal, dropdown or palette" },
      ],
    },
    {
      title: "Navigation Sequences",
      items: [
        { keys: ["G", "D"], description: "Go to Executive Dashboard" },
        { keys: ["G", "T"], description: "Go to Tasks Board & Sprints" },
        { keys: ["G", "E"], description: "Go to Employee Directory" },
        { keys: ["G", "A"], description: "Go to Analytics & Velocity" },
        { keys: ["G", "S"], description: "Go to Workspace Settings" },
        { keys: ["G", "P"], description: "Go to My Profile & Compensation" },
      ],
    },
    {
      title: "Quick Actions",
      items: [
        { keys: ["N"], description: "Create New Task Deliverable" },
        { keys: ["Ctrl", "["], description: "Toggle Left Navigation Sidebar" },
        { keys: ["↑", "↓"], description: "Navigate list items & results" },
        { keys: ["↵"], description: "Select & execute active item" },
      ],
    },
  ];

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-950/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-xl glass-modal rounded-3xl p-6 sm:p-7 shadow-2xl border border-white/60 dark:border-slate-700/80 animate-in zoom-in-95 duration-150 overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-[#5B5FEF] dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/40">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Keyboard Navigation Cheat Sheet
              </h3>
              <p className="text-[12px] text-slate-500 dark:text-slate-400 font-medium">
                Navigate the entire workspace rapidly without touching a mouse
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Shortcuts List */}
        <div className="py-4 space-y-5 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {shortcutGroups.map((group) => (
            <div key={group.title} className="space-y-2">
              <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                {group.title}
              </h4>
              <div className="space-y-1.5">
                {group.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/60"
                  >
                    <span className="text-[13px] font-semibold text-slate-700 dark:text-slate-200">
                      {item.description}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      {item.keys.map((k, kIdx) => (
                        <kbd
                          key={kIdx}
                          className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-[11px] font-extrabold text-slate-700 dark:text-slate-200 shadow-2xs"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11.5px] font-medium text-slate-400">
          <span>Press <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[10px]">Esc</kbd> to close</span>
          <span className="text-[#5B5FEF] font-bold">EmpSphere Power Mode</span>
        </div>
      </div>
    </div>
  );
};
