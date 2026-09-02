"use client";

import { InputHTMLAttributes, forwardRef } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";

interface AuthInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  showValid?: boolean;
  required?: boolean;
}

export const AuthInput = forwardRef<HTMLInputElement, AuthInputProps>(
  (
    { label, error, hint, showValid, required, id, className, ...rest },
    ref,
  ) => {
    const inputId = id || rest.name;
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
            className={`field-input ${error ? "field-input-error" : ""} ${showValid && !error ? "pr-10" : ""} ${className || ""}`}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : undefined}
            {...rest}
          />
          {showValid && !error && rest.value ? (
            <CheckCircle2 className="absolute right-3 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-emerald-500" />
          ) : null}
        </div>
        {error ? (
          <p id={`${inputId}-error`} className="field-error" role="alert">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {error}
          </p>
        ) : hint ? (
          <p className="field-hint">{hint}</p>
        ) : null}
      </div>
    );
  },
);

AuthInput.displayName = "AuthInput";
