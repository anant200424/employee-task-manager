"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, ChevronDown, Search } from "lucide-react";
import { COUNTRIES, getCountryByIso } from "@/lib/countries";
import { FlagImage } from "./FlagImage";

interface PhoneFieldProps {
  countryIso: string;
  phoneNumber: string;
  onCountryChange: (iso: string) => void;
  onPhoneChange: (digits: string) => void;
  error?: string;
  required?: boolean;
}

export const PhoneField = ({
  countryIso,
  phoneNumber,
  onCountryChange,
  onPhoneChange,
  error,
  required,
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
        c.iso.toLowerCase().includes(q)
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
      <label htmlFor="phoneNumber" className="block text-[13px] font-semibold text-slate-800 mb-1.5">
        Phone Number {required && <span className="text-red-500">*</span>}
      </label>

      <div
        ref={wrapperRef}
        className={`relative flex items-center rounded-xl border ${
          error
            ? "border-red-400 bg-red-50/30"
            : "border-slate-300 bg-white hover:border-slate-400"
        } focus-within:bg-white focus-within:border-[#4355CC] focus-within:ring-2 focus-within:ring-[#4355CC]/10 shadow-sm transition-all`}
      >
        {/* Country Selector Button */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex h-full items-center gap-1.5 rounded-l-xl border-r border-slate-300 bg-slate-50 hover:bg-slate-100 px-3 py-2.5 text-[13px] font-medium text-slate-800 transition-colors"
            aria-haspopup="listbox"
            aria-expanded={open}
          >
            <FlagImage iso={country.iso} size="sm" />
            <span className="font-semibold text-slate-800">{country.dialCode}</span>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-500" />
          </button>

          {/* Search Dropdown */}
          {open && (
            <div className="absolute left-0 top-full z-50 mt-2 w-[320px] sm:w-[350px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-fade-up">
              <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/80 px-3.5 py-2.5">
                <Search className="h-4 w-4 shrink-0 text-slate-400" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search country or code..."
                  className="w-full bg-transparent text-[13.5px] font-medium text-slate-800 outline-none placeholder:text-slate-400"
                />
              </div>

              <ul role="listbox" className="max-h-60 overflow-y-auto py-1">
                {filtered.length === 0 ? (
                  <li className="px-4 py-3 text-[13px] text-slate-500">No country found</li>
                ) : (
                  filtered.map((c) => (
                    <li key={c.iso}>
                      <button
                        type="button"
                        onClick={() => {
                          onCountryChange(c.iso);
                          onPhoneChange("");
                          setOpen(false);
                          setQuery("");
                        }}
                        className={`flex w-full items-center gap-3 px-3.5 py-2 text-left text-[13px] transition-colors hover:bg-slate-50 ${
                          c.iso === countryIso ? "bg-blue-50/80 font-semibold text-[#4355CC]" : "text-slate-700"
                        }`}
                      >
                        <span className="flex w-6 shrink-0 items-center justify-center">
                          <FlagImage iso={c.iso} size="sm" />
                        </span>
                        <span className="min-w-0 flex-1 truncate">{c.name}</span>
                        <span className="shrink-0 text-slate-400 font-medium">{c.dialCode}</span>
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
          id="phoneNumber"
          type="tel"
          inputMode="numeric"
          value={phoneNumber}
          onChange={(e) => handlePhoneInput(e.target.value)}
          placeholder={`e.g. ${"9".repeat(Math.min(5, country.exampleDigits))}${"8".repeat(Math.max(0, country.exampleDigits - 5))}`}
          maxLength={country.exampleDigits}
          className="w-full rounded-r-xl bg-transparent px-3.5 py-2.5 text-[13.5px] text-slate-800 placeholder:text-slate-400 outline-none"
        />
      </div>

      {/* Helper text or error */}
      {error ? (
        <p className="mt-1 text-[12px] font-medium text-red-500 flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5" />
          {error}
        </p>
      ) : (
        <p className="mt-1 text-[11.5px] text-slate-400">
          {country.name} numbers are {country.exampleDigits} digits ({phoneNumber.length}/{country.exampleDigits})
        </p>
      )}
    </div>
  );
};
