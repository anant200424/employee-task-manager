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
        className="block text-[12.5px] font-bold text-slate-800 mb-1"
      >
        Phone Number {required && <span className="text-red-500">*</span>}
      </label>

      <div
        ref={wrapperRef}
        className={`relative flex items-stretch rounded-xl border-2 ${
          error
            ? "border-red-400 bg-red-50/30"
            : "border-slate-300 bg-white shadow-[0_2px_10px_-3px_rgba(15,23,42,0.08)] hover:border-[#4355CC]/50"
        } focus-within:bg-white focus-within:border-[#4355CC] focus-within:ring-4 focus-within:ring-[#4355CC]/10 shadow-2xs transition-all`}
      >
        {/* Country Selector Button */}
        <div className="relative shrink-0 flex">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex h-full items-center gap-1.5 rounded-l-xl border-r-2 border-slate-300 bg-slate-50 hover:bg-slate-100 px-3 py-2 text-[13.5px] font-bold text-slate-900 transition-colors cursor-pointer"
            aria-haspopup="listbox"
            aria-expanded={open}
          >
            <FlagImage iso={country.iso} size="sm" />
            <span className="font-bold text-slate-900">{country.dialCode}</span>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-500" />
          </button>

          {/* Search Dropdown */}
          {open && (
            <div className="absolute left-0 top-full z-50 mt-2 w-[320px] sm:w-[350px] overflow-hidden rounded-2xl border-2 border-slate-200 bg-white shadow-2xl animate-fade-up">
              <div className="flex items-center gap-2 border-b-2 border-slate-100 bg-slate-50/80 px-4 py-3">
                <Search className="h-4.5 w-4.5 shrink-0 text-slate-400" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search country or code..."
                  className="w-full bg-transparent text-[14px] font-bold text-slate-800 outline-none placeholder:text-slate-400"
                />
              </div>

              <ul role="listbox" className="max-h-60 overflow-y-auto py-1">
                {filtered.length === 0 ? (
                  <li className="px-4 py-3 text-[13.5px] font-bold text-slate-500">
                    No country found
                  </li>
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
                        className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-[14px] transition-colors hover:bg-slate-50 cursor-pointer ${
                          c.iso === countryIso
                            ? "bg-blue-50/80 font-extrabold text-[#4355CC]"
                            : "text-slate-800 font-bold"
                        }`}
                      >
                        <span className="flex w-6 shrink-0 items-center justify-center">
                          <FlagImage iso={c.iso} size="sm" />
                        </span>
                        <span className="min-w-0 flex-1 truncate">
                          {c.name}
                        </span>
                        <span className="shrink-0 text-slate-500 font-bold">
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
          className="w-full flex-1 rounded-r-xl border-none bg-transparent py-2 pl-3 pr-4 text-[13.5px] font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-medium focus:outline-none focus:ring-0"
          autoComplete="tel"
        />
      </div>

      {/* Helper text or error */}
      {error ? (
        <p className="mt-1 text-[11.5px] font-bold text-red-500 flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5" />
          {error}
        </p>
      ) : (
        <p className="mt-1 text-[11.5px] font-semibold text-slate-500">
          {country.name} numbers are {country.exampleDigits} digits (
          {phoneNumber.length}/{country.exampleDigits})
        </p>
      )}
    </div>
  );
};
