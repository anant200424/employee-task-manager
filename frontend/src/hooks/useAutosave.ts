"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export type AutosaveStatus = "idle" | "saving" | "saved";

interface UseAutosaveOptions<T> {
  key: string;
  data: T;
  debounceMs?: number;
  onCloudSave?: (data: T) => Promise<void>;
  enabled?: boolean;
}

export function useAutosave<T>({
  key,
  data,
  debounceMs = 1500,
  onCloudSave,
  enabled = true,
}: UseAutosaveOptions<T>) {
  const [status, setStatus] = useState<AutosaveStatus>("idle");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const isFirstRender = useRef(true);

  // Auto-save debounced effect
  useEffect(() => {
    if (!enabled) return;

    // Skip initial mount so we don't overwrite on load
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    setStatus("saving");

    const timer = setTimeout(async () => {
      try {
        if (typeof window !== "undefined") {
          localStorage.setItem(key, JSON.stringify(data));
        }

        if (onCloudSave) {
          await onCloudSave(data);
        }

        setStatus("saved");
        setLastSaved(new Date());

        // Return to idle after 3s
        setTimeout(() => {
          setStatus("idle");
        }, 3000);
      } catch (err) {
        console.error("Autosave failed", err);
        setStatus("idle");
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [data, key, debounceMs, onCloudSave, enabled]);

  // Restore saved draft
  const getSavedDraft = useCallback((): T | null => {
    try {
      if (typeof window !== "undefined") {
        const item = localStorage.getItem(key);
        if (item) {
          return JSON.parse(item);
        }
      }
    } catch {}
    return null;
  }, [key]);

  // Clear saved draft on form completion
  const clearDraft = useCallback(() => {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem(key);
      }
      setStatus("idle");
      setLastSaved(null);
    } catch {}
  }, [key]);

  return { status, lastSaved, getSavedDraft, clearDraft };
}

