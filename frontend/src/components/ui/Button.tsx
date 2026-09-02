"use client";

import { ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
  isLoading?: boolean;
}

export const Button = ({
  variant = "primary",
  isLoading,
  children,
  className,
  disabled,
  ...rest
}: ButtonProps) => {
  const base = variant === "primary" ? "btn-primary" : "btn-secondary";
  return (
    <button
      className={`${base} w-full ${className || ""}`}
      disabled={disabled || isLoading}
      {...rest}
    >
      {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
};
