"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle } from "lucide-react";

import { LoginFormData, FormErrors } from "@/types/auth";
import { validateLoginForm } from "@/lib/validation";
import { api, extractApiError, setAccessToken } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";

export const LoginForm = () => {
  const router = useRouter();
  const { setUser } = useAuth();

  const [data, setData] = useState<LoginFormData>({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [errors, setErrors] = useState<FormErrors<LoginFormData>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    router.prefetch("/dashboard");
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("blocked") === "1") {
        setFormError(
          "Access Denied: Your employee account has been suspended/blocked by the administrator. Please contact IT Support or HR.",
        );
      }
    }
  }, [router]);

  const isFormFilled = Boolean(data.email.trim() !== "" && data.password.trim() !== "");
  const canSubmit = isFormFilled && !isSubmitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setFormError(null);

    const validationErrors = validateLoginForm(data);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      const res = await api.post("/auth/login", data);
      const { accessToken, user } = res.data.data;
      setAccessToken(accessToken);
      setUser(user);
      toast.success("Login successful! Welcome to Dashboard.");
      router.push("/dashboard");
    } catch (err) {
      const { message } = extractApiError(err);
      setFormError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      {/* Heading */}
      <div className="text-center mb-7">
        <h2 className="font-serif text-[28px] sm:text-[32px] font-bold text-[#0F172A] tracking-tight">
          Welcome back
        </h2>
        <p className="mt-1.5 text-[13.5px] text-slate-500 font-normal">
          Log in to your workspace and pick up where you left off.
        </p>
      </div>

      {formError && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-[13px] text-red-600 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{formError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* Work Email */}
        <div>
          <label className="block text-[13.5px] font-bold text-slate-800 mb-1.5">
            Work Email <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 pointer-events-none" />
            <input
              type="email"
              name="email"
              value={data.email}
              onChange={(e) => {
                setData((p) => ({ ...p, email: e.target.value }));
                if (errors.email)
                  setErrors((p) => ({ ...p, email: undefined }));
              }}
              placeholder="you@company.com"
              className={`w-full rounded-xl border-2 ${
                errors.email
                  ? "border-red-400 bg-red-50/30"
                  : "border-slate-300 bg-white hover:border-[#4355CC]/50"
              } py-3 pl-11 pr-4 text-[14px] font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-medium focus:bg-white focus:border-[#4355CC] focus:ring-4 focus:ring-[#4355CC]/10 focus:outline-none shadow-2xs transition-all`}
              autoComplete="email"
            />
          </div>
          {errors.email && (
            <p className="mt-1 text-[12px] font-bold text-red-500 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.email}
            </p>
          )}
        </div>

        {/* Password */}
        <div>
          <label className="block text-[13.5px] font-bold text-slate-800 mb-1.5">
            Password <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 pointer-events-none" />
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={data.password}
              onChange={(e) => {
                setData((p) => ({ ...p, password: e.target.value }));
                if (errors.password)
                  setErrors((p) => ({ ...p, password: undefined }));
              }}
              placeholder="Enter your password"
              className={`w-full rounded-xl border-2 ${
                errors.password
                  ? "border-red-400 bg-red-50/30"
                  : "border-slate-300 bg-white hover:border-[#4355CC]/50"
              } py-3 pl-11 pr-11 text-[14px] font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-medium focus:bg-white focus:border-[#4355CC] focus:ring-4 focus:ring-[#4355CC]/10 focus:outline-none shadow-2xs transition-all`}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="w-4.5 h-4.5" />
              ) : (
                <Eye className="w-4.5 h-4.5" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-[12px] font-bold text-red-500 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.password}
            </p>
          )}
        </div>

        {/* Remember me & Forgot Password */}
        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={data.rememberMe}
              onChange={(e) =>
                setData((p) => ({ ...p, rememberMe: e.target.checked }))
              }
              className="h-4.5 w-4.5 rounded border-2 border-slate-300 text-[#4355CC] focus:ring-[#4355CC]/20 cursor-pointer"
            />
            <span className="text-[13px] text-slate-700 font-bold">
              Remember me
            </span>
          </label>
          <Link
            href="/forgot-password"
            className="text-[13px] font-bold text-[#4355CC] hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        {/* SUBMIT BUTTON */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={!canSubmit}
            className={`group relative w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-[15px] font-extrabold text-white transition-all overflow-hidden ${
              !canSubmit
                ? "bg-[#4355CC]/40 text-white/70 cursor-not-allowed opacity-50 backdrop-blur-xs pointer-events-none shadow-none"
                : "bg-[#4355CC] hover:bg-[#3644A8] hover:shadow-[0_8px_20px_-6px_rgba(67,85,204,0.5)] active:scale-[0.99] cursor-pointer"
            }`}
          >
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer" />
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Login</span>
                <ArrowRight className="w-4.5 h-4.5 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </button>
        </div>

        {/* BOTTOM LINK */}
        <div className="pt-2 text-center">
          <p className="text-[13.5px] text-slate-600">
            New to EmpSphere?{" "}
            <Link
              href="/register"
              className="font-semibold text-[#4355CC] hover:underline"
            >
              Create an account
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
};
