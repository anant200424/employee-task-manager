"use client";

import { useEffect } from "react";

export function ThemeHydration() {
  useEffect(() => {
    const applyPreferences = () => {
      try {
        // 1. Theme
        const t = (localStorage.getItem("theme") as "light" | "dark" | "system") || "light";
        const isDark =
          t === "dark" ||
          (t === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);
        if (isDark) {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }

        // 2. Accent Color
        const a = localStorage.getItem("accentColor") || "Indigo";
        document.documentElement.setAttribute("data-accent", a.toLowerCase().replace(/\s+/g, "-"));

        // 3. Density
        const d = localStorage.getItem("density") || "Comfortable";
        document.documentElement.setAttribute("data-density", d.toLowerCase());

        // 4. Display Scale / Zoom
        const s = parseInt(localStorage.getItem("app_scale") || "100", 10);
        if (!isNaN(s) && s >= 80 && s <= 150) {
          document.documentElement.style.fontSize = `${16 * (s / 100)}px`;
          (document.documentElement.style as any).zoom = `${s / 100}`;
        }
      } catch {}
    };

    applyPreferences();

    window.addEventListener("theme-change", applyPreferences);
    window.addEventListener("accent-color-change", applyPreferences);
    window.addEventListener("density-change", applyPreferences);
    window.addEventListener("scale-change", applyPreferences);

    return () => {
      window.removeEventListener("theme-change", applyPreferences);
      window.removeEventListener("accent-color-change", applyPreferences);
      window.removeEventListener("density-change", applyPreferences);
      window.removeEventListener("scale-change", applyPreferences);
    };
  }, []);

  return null;
}
