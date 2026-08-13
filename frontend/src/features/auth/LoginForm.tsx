"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle } from "lucide-react";

import { LoginFormData, FormErrors } from "@/types/auth";
import { validateLoginForm } from "@/lib/validation";
import { api, extractApiError, setAccessToken } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
          <label className="block text-[13px] font-semibold text-slate-800 mb-1.5">
            Work Email <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="email"
              name="email"
              value={data.email}
              onChange={(e) => {
                setData((p) => ({ ...p, email: e.target.value }));
                if (errors.email) setErrors((p) => ({ ...p, email: undefined }));
              }}
              placeholder="you@company.com"
              className={`w-full rounded-xl border ${
                errors.email
                  ? "border-red-400 bg-red-50/30"
                  : "border-slate-300 bg-white hover:border-slate-400"
              } py-2.5 pl-10 pr-3.5 text-[13.5px] text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-[#4355CC] focus:ring-2 focus:ring-[#4355CC]/10 focus:outline-none shadow-sm transition-all`}
              autoComplete="email"
            />
          </div>
          {errors.email && (
            <p className="mt-1 text-[12px] font-medium text-red-500 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.email}
            </p>
          )}
        </div>

        {/* Password */}
        <div>
          <label className="block text-[13px] font-semibold text-slate-800 mb-1.5">
            Password <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={data.password}
              onChange={(e) => {
                setData((p) => ({ ...p, password: e.target.value }));
                if (errors.password) setErrors((p) => ({ ...p, password: undefined }));
              }}
              placeholder="Enter your password"
              className={`w-full rounded-xl border ${
                errors.password
                  ? "border-red-400 bg-red-50/30"
                  : "border-slate-300 bg-white hover:border-slate-400"
              } py-2.5 pl-10 pr-10 text-[13.5px] text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-[#4355CC] focus:ring-2 focus:ring-[#4355CC]/10 focus:outline-none shadow-sm transition-all`}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-[12px] font-medium text-red-500 flex items-center gap-1">
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
              className="h-4 w-4 rounded border-slate-300 text-[#4355CC] focus:ring-[#4355CC]/20 cursor-pointer"
            />
            <span className="text-[13px] text-slate-600 font-normal">
              Remember me
            </span>
          </label>
          <Link
            href="/forgot-password"
            className="text-[13px] font-semibold text-[#4355CC] hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        {/* SUBMIT BUTTON */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#4355CC] hover:bg-[#3747B8] active:scale-[0.99] py-3 text-[14.5px] font-medium text-white shadow-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Login</span>
                <ArrowRight className="w-4 h-4" />
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
