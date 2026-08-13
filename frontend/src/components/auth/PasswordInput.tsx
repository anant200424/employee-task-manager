"use client";

import { InputHTMLAttributes, forwardRef, useState } from "react";
import { AlertCircle, Eye, EyeOff, Check, X } from "lucide-react";
import { getPasswordStrength } from "@/lib/validation";

interface PasswordInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  required?: boolean;
  showStrength?: boolean;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ label, error, required, showStrength, id, value, className, ...rest }, ref) => {
    const [visible, setVisible] = useState(false);
    const inputId = id || rest.name;
    const strength = showStrength ? getPasswordStrength(String(value || "")) : null;

    const barColors = ["bg-red-500", "bg-orange-500", "bg-amber-500", "bg-emerald-500", "bg-emerald-600"];

    return (
      <div>
        <label htmlFor={inputId} className="field-label">
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </label>
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type={visible ? "text" : "password"}
            value={value}
            className={`field-input pr-12 ${error ? "field-input-error" : ""} ${className || ""}`}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : undefined}
            {...rest}
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-500 hover:text-ink-700 transition-colors"
            aria-label={visible ? "Hide password" : "Show password"}
            tabIndex={-1}
          >
            {visible ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
          </button>
        </div>

        {showStrength && value ? (
          <div className="mt-2.5 space-y-2">
            <div className="flex gap-1.5">
              {[0, 1, 2, 3, 4].map((i) => (
                <span
                  key={i}
                  className={`h-1.5 flex-1 rounded-full transition-colors ${
                    strength && i <= strength.score ? barColors[strength.score] : "bg-ink-100"
                  }`}
                />
              ))}
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1">
              {strength &&
                Object.entries({
                  "8+ characters": strength.checks.length,
                  Uppercase: strength.checks.uppercase,
                  Lowercase: strength.checks.lowercase,
                  "Number & symbol": strength.checks.number && strength.checks.special,
                }).map(([label2, pass]) => (
                  <span key={label2} className="flex items-center gap-1 text-[12px] text-ink-500">
                    {pass ? (
                      <Check className="h-3 w-3 text-emerald-600" />
                    ) : (
                      <X className="h-3 w-3 text-ink-300" />
                    )}
                    {label2}
                  </span>
                ))}
            </div>
          </div>
        ) : null}

        {error && (
          <p id={`${inputId}-error`} className="field-error" role="alert">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {error}
          </p>
        )}
      </div>
    );
  }
);

PasswordInput.displayName = "PasswordInput";
