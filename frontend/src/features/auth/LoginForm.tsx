"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle } from "lucide-react";

import { LoginFormData, FormErrors } from "@/types/auth";
import { validateLoginForm } from "@/lib/validation";
import { api, extractApiError, setAccessToken } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import toast from "react-hot-toast";

export const LoginForm = () => {
  const router = useRouter();
  const { setUser } = useAuth();
  const { t } = useLanguage();

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

      // Restore remembered email on client
      const rememberedEmail = localStorage.getItem("empsphere_remembered_email");
      if (rememberedEmail) {
        setData((prev) => ({
          ...prev,
          email: rememberedEmail,
          rememberMe: true,
        }));
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

    // Persist or clear remembered email on client only
    if (typeof window !== "undefined") {
      if (data.rememberMe && data.email.trim()) {
        localStorage.setItem("empsphere_remembered_email", data.email.trim());
      } else {
        localStorage.removeItem("empsphere_remembered_email");
      }
    }

    setIsSubmitting(true);
    try {
      // Send ONLY credentials to backend - rememberMe remains strictly on frontend
      const res = await api.post("/auth/login", {
        email: data.email.trim(),
        password: data.password,
      });
      const { user, accessToken } = res.data?.data || {};
      if (accessToken) {
        setAccessToken(accessToken);
      }
      if (user) {
        setUser(user);
      }
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
    <div className="w-full min-w-0 max-w-full">
      {/* Heading */}
      <div className="text-center mb-4 sm:mb-6">
        <h2 className="font-serif text-[20px] xs:text-[24px] sm:text-[28px] font-black text-[#0F172A] dark:text-white tracking-tight break-words">
          {t("auth_welcome_back", "Welcome back")}
        </h2>
        <p className="mt-1 text-[12px] sm:text-[13.5px] text-slate-600 dark:text-slate-400 font-medium break-words">
          {t("auth_login_subtitle", "Log in to your workspace and pick up where you left off.")}
        </p>
      </div>

      {formError && (
        <div
          role="alert"
          aria-live="assertive"
          className="mb-4 sm:mb-5 rounded-xl border-2 border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 p-2.5 sm:p-3 text-[12.5px] sm:text-[13px] font-bold text-red-700 dark:text-red-300 flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400" aria-hidden="true" />
          <span className="break-words">{formError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-3.5 sm:space-y-4 w-full min-w-0 max-w-full">
        {/* Work Email */}
        <div className="w-full min-w-0">
          <label
            htmlFor="login-email"
            className="block text-[12.5px] sm:text-[13px] font-bold text-slate-800 dark:text-slate-200 mb-1"
          >
            {t("auth_work_email", "Work Email")}{" "}
            <span className="text-red-600 dark:text-red-400 font-black" aria-hidden="true">
              *
            </span>
            <span className="sr-only"> (required)</span>
          </label>
          <div className="relative w-full min-w-0">
            <Mail
              aria-hidden="true"
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 dark:text-slate-400 pointer-events-none shrink-0"
            />
            <input
              type="email"
              id="login-email"
              name="email"
              value={data.email}
              onChange={(e) => {
                setData((p) => ({ ...p, email: e.target.value }));
                if (errors.email)
                  setErrors((p) => ({ ...p, email: undefined }));
              }}
              placeholder="you@company.com"
              aria-required="true"
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "login-email-error" : undefined}
              className={`w-full min-w-0 box-border rounded-xl border-2 ${
                errors.email
                  ? "border-red-400 bg-red-50/30 dark:bg-red-950/20"
                  : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/90 hover:border-[#4355CC]/50 dark:hover:border-indigo-500/50"
              } py-2.5 sm:py-3 pl-10 pr-3.5 text-[13.5px] sm:text-[14px] font-bold text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-500 placeholder:font-medium focus:bg-white focus:dark:bg-slate-800 focus:border-[#4355CC] dark:focus:border-indigo-500 focus:ring-4 focus:ring-[#4355CC]/15 dark:focus:ring-indigo-500/20 focus:outline-none shadow-2xs transition-all`}
              autoComplete="email"
            />
          </div>
          {errors.email && (
            <p
              id="login-email-error"
              role="alert"
              className="mt-1 text-[11.5px] sm:text-[12px] font-bold text-red-700 dark:text-red-400 flex items-center gap-1 animate-in fade-in duration-150 break-words"
            >
              <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>{errors.email}</span>
            </p>
          )}
        </div>

        {/* Password */}
        <div className="w-full min-w-0">
          <label
            htmlFor="login-password"
            className="block text-[12.5px] sm:text-[13px] font-bold text-slate-800 dark:text-slate-200 mb-1"
          >
            {t("auth_password", "Password")}{" "}
            <span className="text-red-600 dark:text-red-400 font-black" aria-hidden="true">
              *
            </span>
            <span className="sr-only"> (required)</span>
          </label>
          <div className="relative w-full min-w-0">
            <Lock
              aria-hidden="true"
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 dark:text-slate-400 pointer-events-none shrink-0"
            />
            <input
              type={showPassword ? "text" : "password"}
              id="login-password"
              name="password"
              value={data.password}
              onChange={(e) => {
                setData((p) => ({ ...p, password: e.target.value }));
                if (errors.password)
                  setErrors((p) => ({ ...p, password: undefined }));
              }}
              placeholder="Enter your password"
              aria-required="true"
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? "login-password-error" : undefined}
              className={`w-full min-w-0 box-border rounded-xl border-2 ${
                errors.password
                  ? "border-red-400 bg-red-50/30 dark:bg-red-950/20"
                  : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/90 hover:border-[#4355CC]/50 dark:hover:border-indigo-500/50"
              } py-2.5 sm:py-3 pl-10 pr-10 text-[13.5px] sm:text-[14px] font-bold text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-500 placeholder:font-medium focus:bg-white focus:dark:bg-slate-800 focus:border-[#4355CC] dark:focus:border-indigo-500 focus:ring-4 focus:ring-[#4355CC]/15 dark:focus:ring-indigo-500/20 focus:outline-none shadow-2xs transition-all`}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 focus-visible:outline-2 focus-visible:outline-[#4355CC] rounded-sm p-0.5 transition-colors cursor-pointer shrink-0"
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
            >
              {showPassword ? (
                <Eye className="w-4 h-4" aria-hidden="true" />
              ) : (
                <EyeOff className="w-4 h-4" aria-hidden="true" />
              )}
            </button>
          </div>
          {errors.password && (
            <p
              id="login-password-error"
              role="alert"
              className="mt-1 text-[11.5px] sm:text-[12px] font-bold text-red-700 dark:text-red-400 flex items-center gap-1 animate-in fade-in duration-150 break-words"
            >
              <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>{errors.password}</span>
            </p>
          )}
        </div>

        {/* Remember me & Forgot Password */}
        <div className="flex flex-wrap items-center justify-between gap-1.5 pt-0.5 w-full min-w-0">
          <label
            htmlFor="login-rememberMe"
            className="flex items-center gap-1.5 cursor-pointer select-none shrink-0"
          >
            <input
              type="checkbox"
              id="login-rememberMe"
              checked={data.rememberMe}
              onChange={(e) => {
                const isChecked = e.target.checked;
                setData((p) => ({ ...p, rememberMe: isChecked }));
                if (!isChecked && typeof window !== "undefined") {
                  localStorage.removeItem("empsphere_remembered_email");
                }
              }}
              className="h-4 w-4 rounded border-2 border-slate-300 dark:border-slate-700 dark:bg-slate-800 text-[#4355CC] focus:ring-4 focus:ring-[#4355CC]/20 cursor-pointer shrink-0"
            />
            <span className="text-[12px] sm:text-[13px] text-slate-800 dark:text-slate-200 font-bold">
              {t("auth_remember_me", "Remember me")}
            </span>
          </label>
          <Link
            href="/forgot-password"
            className="text-[12px] sm:text-[13px] font-bold text-[#3644A8] dark:text-indigo-400 hover:text-[#25328A] dark:hover:text-indigo-300 hover:underline focus-visible:outline-2 focus-visible:outline-[#4355CC] rounded-xs shrink-0"
          >
            {t("auth_forgot_password", "Forgot password?")}
          </Link>
        </div>

        {/* SUBMIT BUTTON */}
        <div className="pt-1 w-full min-w-0">
          <button
            type="submit"
            disabled={!canSubmit}
            aria-busy={isSubmitting}
            className={`group relative w-full min-w-0 flex items-center justify-center gap-2 rounded-xl py-3 sm:py-3.5 text-[14px] sm:text-[15px] font-extrabold text-white transition-all overflow-hidden focus-visible:outline-2 focus-visible:outline-[#4355CC] focus-visible:outline-offset-2 ${
              !canSubmit
                ? "bg-[#4355CC]/40 text-white/70 cursor-not-allowed opacity-60 backdrop-blur-xs pointer-events-none shadow-none"
                : "bg-[#4355CC] hover:bg-[#3644A8] dark:bg-indigo-600 dark:hover:bg-indigo-500 hover:shadow-[0_8px_20px_-6px_rgba(67,85,204,0.5)] active:scale-[0.99] cursor-pointer"
            }`}
          >
            <div
              aria-hidden="true"
              className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer"
            />
            {isSubmitting ? (
              <div
                aria-label={t("auth_logging_in", "Logging in...")}
                className="w-4.5 h-4.5 border-2 border-white border-t-transparent rounded-full animate-spin"
              />
            ) : (
              <>
                <span className="truncate">{t("auth_login_btn", "Login")}</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1 shrink-0" aria-hidden="true" />
              </>
            )}
          </button>
        </div>

        {/* BOTTOM LINK */}
        <div className="pt-1 text-center w-full min-w-0">
          <p className="text-[12.5px] sm:text-[13.5px] text-slate-700 dark:text-slate-400 font-medium break-words">
            {t("auth_new_to_empsphere", "New to EmpSphere?")}{" "}
            <Link
              href="/register"
              className="font-bold text-[#3644A8] dark:text-indigo-400 hover:text-[#25328A] dark:hover:text-indigo-300 hover:underline focus-visible:outline-2 focus-visible:outline-[#4355CC] rounded-xs"
            >
              {t("auth_create_account", "Create an account")}
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
};
