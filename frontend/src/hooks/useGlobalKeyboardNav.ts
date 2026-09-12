"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface KeyboardNavOptions {
  onOpenNewTask?: () => void;
  onOpenShortcutsModal?: () => void;
  onOpenSearch?: () => void;
  onEscape?: () => void;
}

export const useGlobalKeyboardNav = ({
  onOpenNewTask,
  onOpenShortcutsModal,
  onOpenSearch,
  onEscape,
}: KeyboardNavOptions = {}) => {
  const router = useRouter();
  const lastKeyRef = useRef<string | null>(null);
  const keyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!e || typeof e.key !== "string") return;

      const activeEl = document.activeElement;
      const isInput =
        activeEl?.tagName === "INPUT" ||
        activeEl?.tagName === "TEXTAREA" ||
        activeEl?.tagName === "SELECT" ||
        (activeEl as HTMLElement)?.isContentEditable;

      // Escape always works, even inside inputs
      if (e.key === "Escape") {
        if (onEscape) {
          onEscape();
        }
        window.dispatchEvent(new Event("nexus-close-modals"));
        return;
      }

      // If user is typing in a text field, do not trigger single-letter shortcuts
      if (isInput) return;

      const key = e.key.toLowerCase();

      // Open search on forward slash "/"
      if (e.key === "/") {
        e.preventDefault();
        if (onOpenSearch) onOpenSearch();
        window.dispatchEvent(new Event("nexus-open-search"));
        return;
      }

      // Open shortcuts cheat sheet on "?"
      if (e.key === "?") {
        e.preventDefault();
        if (onOpenShortcutsModal) onOpenShortcutsModal();
        window.dispatchEvent(new Event("nexus-open-shortcuts"));
        return;
      }

      // 'N' for New Task
      if (key === "n" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        if (onOpenNewTask) {
          onOpenNewTask();
        } else {
          router.push("/tasks?action=new");
        }
        return;
      }

      // Sequence navigation: G then D (Dashboard), G then T (Tasks), etc.
      if (lastKeyRef.current === "g") {
        if (key === "d") {
          e.preventDefault();
          router.push("/dashboard");
        } else if (key === "t") {
          e.preventDefault();
          router.push("/tasks");
        } else if (key === "e") {
          e.preventDefault();
          router.push("/employees");
        } else if (key === "a") {
          e.preventDefault();
          router.push("/analytics");
        } else if (key === "s") {
          e.preventDefault();
          router.push("/settings");
        } else if (key === "p") {
          e.preventDefault();
          router.push("/profile");
        }

        lastKeyRef.current = null;
        if (keyTimeoutRef.current) clearTimeout(keyTimeoutRef.current);
        return;
      }

      if (key === "g") {
        lastKeyRef.current = "g";
        if (keyTimeoutRef.current) clearTimeout(keyTimeoutRef.current);
        keyTimeoutRef.current = setTimeout(() => {
          lastKeyRef.current = null;
        }, 1200);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (keyTimeoutRef.current) clearTimeout(keyTimeoutRef.current);
    };
  }, [router, onOpenNewTask, onOpenShortcutsModal, onOpenSearch, onEscape]);
};
