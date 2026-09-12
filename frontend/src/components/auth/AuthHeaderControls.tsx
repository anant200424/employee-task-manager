"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Globe, Sun, Moon, Check, ChevronDown, Shield } from "lucide-react";
import { useLanguage, LANGUAGES } from "@/context/LanguageContext";
import { toast } from "react-hot-toast";

interface AuthHeaderControlsProps {
  portalLink?: string;
  portalLabel?: string;
  portalIcon?: React.ReactNode;
}

export const AuthHeaderControls = ({
  portalLink,
  portalLabel,
  portalIcon,
}: AuthHeaderControlsProps) => {
  const { language, setLanguage, currentLanguageOption, t } = useLanguage();
  const [langOpen, setLangOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const langRef = useRef<HTMLDivElement>(null);

  // Sync theme with system & localStorage
  useEffect(() => {
    const updateThemeState = () => {
      const savedTheme = (localStorage.getItem("theme") as "light" | "dark" | "system") || "light";
      let isDark = false;
      if (savedTheme === "dark") {
        isDark = true;
      } else if (savedTheme === "system") {
        isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      } else {
        isDark = false;
      }

      setTheme(isDark ? "dark" : "light");
      if (isDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    };

    updateThemeState();
    window.addEventListener("theme-change", updateThemeState);
    window.addEventListener("storage", updateThemeState);

    return () => {
      window.removeEventListener("theme-change", updateThemeState);
      window.removeEventListener("storage", updateThemeState);
    };
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    window.dispatchEvent(new Event("theme-change"));
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(event.target as Node)) {
        setLangOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex items-center gap-2 sm:gap-2.5">
      {/* 1. Language Selector Dropdown */}
      <div ref={langRef} className="relative">
        <button
          type="button"
          onClick={() => setLangOpen((prev) => !prev)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[12.5px] font-bold shadow-xs backdrop-blur-sm transition-all cursor-pointer ${
            langOpen
              ? "bg-[#EEF0FF] dark:bg-[#5B5FEF]/20 text-[#5B5FEF] dark:text-[#818CF8] border-[#5B5FEF]/40"
              : "bg-white/85 dark:bg-slate-900/85 hover:bg-white dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
          }`}
          aria-label={t("language", "Language")}
          title={t("language", "Select Language")}
        >
          <span className="text-sm leading-none">{currentLanguageOption?.flag || "🌐"}</span>
          <span className="hidden xs:inline uppercase text-[11.5px] font-extrabold tracking-wider">
            {language}
          </span>
          <ChevronDown
            className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${
              langOpen ? "rotate-180 text-[#5B5FEF]" : ""
            }`}
          />
        </button>

        {/* Dropdown Menu */}
        {langOpen && (
          <div className="absolute right-0 top-full z-50 mt-2 w-[210px] overflow-hidden rounded-2xl border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-[0_12px_40px_rgba(15,23,42,0.15)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.6)] p-1.5 space-y-1 animate-in fade-in zoom-in-95">
            <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 mb-1 flex items-center gap-2">
              <Globe className="w-3.5 h-3.5 text-[#5B5FEF]" />
              <span className="text-[10.5px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-wider">
                {t("language", "Language")}
              </span>
            </div>
            {LANGUAGES.map((lang) => {
              const isSelected = language === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => {
                    setLanguage(lang.code);
                    setLangOpen(false);
                    toast.success(`${t("lang_set_to", "Language set to")} ${lang.name} (${lang.nativeName})`);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[12.5px] font-bold transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[#EEF0FF] dark:bg-[#5B5FEF]/20 text-[#5B5FEF] dark:text-[#818CF8]"
                      : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base leading-none">{lang.flag}</span>
                    <div className="text-left">
                      <p className="leading-tight">{lang.name}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{lang.nativeName}</p>
                    </div>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-[#5B5FEF]" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Dark / Light Mode Toggle Button */}
      <button
        type="button"
        onClick={toggleTheme}
        className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/85 dark:bg-slate-900/85 hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all flex items-center justify-center shadow-xs backdrop-blur-sm cursor-pointer active:scale-95"
        aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      >
        {theme === "dark" ? (
          <Sun className="h-4.5 w-4.5 text-amber-400 animate-in spin-in-90 duration-200" />
        ) : (
          <Moon className="h-4.5 w-4.5 text-slate-600 animate-in spin-in-90 duration-200" />
        )}
      </button>

      {/* 3. Optional Portal Link Badge */}
      {portalLink && (
        <Link
          href={portalLink}
          className="flex items-center gap-2 rounded-xl bg-white/85 dark:bg-slate-900/85 hover:bg-white dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3.5 py-1.5 text-[12.5px] font-bold text-[#3644A8] dark:text-indigo-400 hover:text-[#25328A] dark:hover:text-indigo-300 shadow-xs backdrop-blur-sm transition-all active:scale-95"
        >
          {portalIcon || <Shield className="w-4 h-4 shrink-0" />}
          <span className="hidden sm:inline">{portalLabel}</span>
        </Link>
      )}
    </div>
  );
};
