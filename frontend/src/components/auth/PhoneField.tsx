"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, ChevronDown, Search } from "lucide-react";
import { COUNTRIES, getCountryByIso } from "@/lib/countries";
import { FlagImage } from "./FlagImage";

interface PhoneFieldProps {
  countryIso: string;
  phoneNumber: string;
  onCountryChange: (_iso: string) => void;
  onPhoneChange: (_digits: string) => void;
  error?: string;
  required?: boolean;
  onBlur?: () => void;
}

export const PhoneField = ({
  countryIso,
  phoneNumber,
  onCountryChange,
  onPhoneChange,
  error,
  required,
  onBlur,
}: PhoneFieldProps) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);

  const country = getCountryByIso(countryIso) || COUNTRIES[0];

  const filtered = useMemo(() => {
    if (!query.trim()) return COUNTRIES;
    const q = query.trim().toLowerCase();
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.dialCode.includes(q) ||
        c.iso.toLowerCase().includes(q),
    );
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handlePhoneInput = (raw: string) => {
    // Only numeric digits, capped at the country's exact max length
    const digitsOnly = raw.replace(/\D/g, "").slice(0, country.exampleDigits);
    onPhoneChange(digitsOnly);
  };

  return (
    <div>
      <label
        htmlFor="phoneNumber"
        className="block text-[12.5px] font-bold text-slate-800 dark:text-slate-200 mb-1"
      >
        Phone Number{" "}
        {required && (
          <>
            <span className="text-red-600 dark:text-red-400 font-black" aria-hidden="true">
              *
            </span>
            <span className="sr-only"> (required)</span>
          </>
        )}
      </label>

      <div
        ref={wrapperRef}
        className={`relative flex items-stretch rounded-xl border-2 ${
          error
            ? "border-red-400 bg-red-50/30 dark:bg-red-950/20"
            : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/90 shadow-[0_2px_10px_-3px_rgba(15,23,42,0.08)] hover:border-[#4355CC]/50 dark:hover:border-indigo-500/50"
        } focus-within:bg-white focus-within:dark:bg-slate-800 focus-within:border-[#4355CC] dark:focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-[#4355CC]/10 dark:focus-within:ring-indigo-500/20 shadow-2xs transition-all`}
      >
        {/* Country Selector Button */}
        <div className="relative shrink-0 flex">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex h-full items-center gap-1.5 rounded-l-xl border-r-2 border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 px-3 py-2 text-[13.5px] font-bold text-slate-900 dark:text-slate-100 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[#4355CC]"
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-label={`Select country code, currently ${country.name} (${country.dialCode})`}
          >
            <FlagImage iso={country.iso} size="sm" />
            <span className="font-bold text-slate-900 dark:text-slate-100">{country.dialCode}</span>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-500 dark:text-slate-400" aria-hidden="true" />
          </button>

          {/* Search Dropdown */}
          {open && (
            <div className="absolute left-0 top-full z-50 mt-2 w-[280px] xs:w-[320px] sm:w-[350px] max-w-[calc(100vw-32px)] overflow-hidden rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl animate-fade-up">
              <div className="flex items-center gap-2 border-b-2 border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/80 px-4 py-3">
                <Search className="h-4.5 w-4.5 shrink-0 text-slate-500 dark:text-slate-400" aria-hidden="true" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search country or code..."
                  aria-label="Search country or dial code"
                  className="w-full bg-transparent text-[14px] font-bold text-slate-800 dark:text-white outline-none placeholder:text-slate-500"
                />
              </div>

              <ul role="listbox" aria-label="Country list" className="max-h-60 overflow-y-auto py-1">
                {filtered.length === 0 ? (
                  <li className="px-4 py-3 text-[13.5px] font-bold text-slate-500 dark:text-slate-400">
                    No country found
                  </li>
                ) : (
                  filtered.map((c) => (
                    <li key={c.iso} role="option" aria-selected={c.iso === countryIso}>
                      <button
                        type="button"
                        onClick={() => {
                          onCountryChange(c.iso);
                          onPhoneChange("");
                          setOpen(false);
                          setQuery("");
                        }}
                        className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-[14px] transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer ${
                          c.iso === countryIso
                            ? "bg-blue-50/80 dark:bg-indigo-950/60 font-extrabold text-[#4355CC] dark:text-indigo-400"
                            : "text-slate-800 dark:text-slate-200 font-bold"
                        }`}
                      >
                        <span className="flex w-6 shrink-0 items-center justify-center">
                          <FlagImage iso={c.iso} size="sm" />
                        </span>
                        <span className="min-w-0 flex-1 truncate">
                          {c.name}
                        </span>
                        <span className="shrink-0 text-slate-600 dark:text-slate-400 font-bold">
                          {c.dialCode}
                        </span>
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </div>
          )}
        </div>

        {/* Input */}
        <input
          type="tel"
          id="phoneNumber"
          name="phoneNumber"
          value={phoneNumber}
          onChange={(e) => handlePhoneInput(e.target.value)}
          onBlur={onBlur}
          placeholder={`e.g. ${"9".repeat(country.exampleDigits)}`}
          maxLength={country.exampleDigits}
          aria-required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "phoneNumber-error" : undefined}
          className="w-full flex-1 rounded-r-xl border-none bg-transparent py-2 pl-3 pr-4 text-[14px] font-bold text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-500 placeholder:font-medium focus:outline-none focus:ring-0"
          autoComplete="tel"
        />
      </div>

      {/* Error message */}
      {error && (
        <p
          id="phoneNumber-error"
          role="alert"
          className="mt-1 text-[12px] font-bold text-red-700 dark:text-red-400 flex items-center gap-1 animate-in fade-in duration-150"
        >
          <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
};
