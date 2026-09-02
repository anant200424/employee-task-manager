"use client";

import { useRef, useState, KeyboardEvent, ClipboardEvent } from "react";

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (_value: string) => void;
  disabled?: boolean;
  error?: boolean;
  onComplete?: () => void;
}

export const OtpInput = ({
  length = 6,
  value,
  onChange,
  disabled = false,
  error = false,
  onComplete,
}: OtpInputProps) => {
  const [activeInput, setActiveInput] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Convert string value to array of characters
  const otpArray = value.split("").slice(0, length);
  while (otpArray.length < length) otpArray.push("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number,
  ) => {
    const val = e.target.value;
    if (!/^[0-9]*$/.test(val)) return; // Only numeric

    const newOtp = [...otpArray];
    // Keep only the last character if multiple are typed
    newOtp[index] = val.substring(val.length - 1);
    const otpString = newOtp.join("");
    onChange(otpString);

    if (val && index < length - 1) {
      setActiveInput(index + 1);
      inputRefs.current[index + 1]?.focus();
    }

    if (otpString.length === length && onComplete && val) {
      onComplete();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const newOtp = [...otpArray];

      if (otpArray[index]) {
        // If current box has a value, clear it
        newOtp[index] = "";
        onChange(newOtp.join(""));
      } else if (index > 0) {
        // If current box is empty, move back and clear that one
        newOtp[index - 1] = "";
        onChange(newOtp.join(""));
        setActiveInput(index - 1);
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      setActiveInput(index - 1);
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      e.preventDefault();
      setActiveInput(index + 1);
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData
      .getData("text/plain")
      .replace(/\D/g, "")
      .slice(0, length);

    if (pastedData) {
      onChange(pastedData);
      const nextIndex = Math.min(pastedData.length, length - 1);
      setActiveInput(nextIndex);
      inputRefs.current[nextIndex]?.focus();

      if (pastedData.length === length && onComplete) {
        onComplete();
      }
    }
  };

  const handleFocus = (index: number) => {
    setActiveInput(index);
    // Auto-select text so typing immediately replaces it
    inputRefs.current[index]?.select();
  };

  return (
    <div className="flex items-center justify-between gap-2 sm:gap-3">
      {otpArray.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={digit}
          disabled={disabled}
          autoFocus={index === 0}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={handlePaste}
          onFocus={() => handleFocus(index)}
          className={`w-11 h-14 sm:w-12 sm:h-16 text-center text-xl font-bold rounded-xl border-2 outline-none transition-all ${
            disabled
              ? "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed"
              : error
                ? "bg-red-50/50 border-red-400 text-red-600 focus:border-red-500 focus:ring-4 focus:ring-red-500/20"
                : digit
                  ? "bg-white border-[#4355CC] text-slate-800"
                  : activeInput === index
                    ? "bg-white border-[#4355CC] ring-4 ring-[#4355CC]/10 text-slate-800"
                    : "bg-white border-slate-300 hover:border-slate-400 text-slate-800"
          }`}
          aria-label={`Digit ${index + 1}`}
        />
      ))}
    </div>
  );
};
