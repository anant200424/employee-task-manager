"use client";

import { Check, Loader2 } from "lucide-react";
import { AutosaveStatus } from "@/hooks/useAutosave";

interface AutosaveBadgeProps {
  status: AutosaveStatus;
  lastSaved: Date | null;
  className?: string;
}

export const AutosaveBadge = ({
  status,
  lastSaved,
  className = "",
}: AutosaveBadgeProps) => {
  if (status === "idle" && !lastSaved) return null;

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all select-none ${
        status === "saving"
          ? "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/60"
          : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60"
      } ${className}`}
    >
      {status === "saving" ? (
        <>
          <Loader2 className="w-3 h-3 animate-spin text-amber-500" />
          <span>Auto-saving draft...</span>
        </>
      ) : (
        <>
          <Check className="w-3 h-3 text-emerald-500" />
          <span>Draft auto-saved</span>
          {lastSaved && (
            <span className="opacity-70 text-[10px]">
              ({lastSaved.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})
            </span>
          )}
        </>
      )}
    </div>
  );
};
