"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { ResetPasswordFormData, FormErrors } from "@/types/auth";
import { validateResetPasswordForm } from "@/lib/validation";
import { api, extractApiError } from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";

export const ResetPasswordForm = ({ token }: { token: string }) => {
  const router = useRouter();
  const { t } = useLanguage();
  const [data, setData] = useState<ResetPasswordFormData>({
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<FormErrors<ResetPasswordFormData>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const validationErrors = validateResetPasswordForm(data);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      await api.post(`/auth/reset-password/${token}`, data);
      setIsDone(true);
      setTimeout(() => router.push("/login"), 2200);
    } catch (err) {
      const { message } = extractApiError(err);
      setFormError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isDone) {
    return (
      <div className="w-full min-w-0 max-w-full text-center py-2">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800">
          <CheckCircle2 className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h2 className="mt-5 font-serif text-[24px] sm:text-[26px] font-bold text-[#0F172A] dark:text-white tracking-tight break-words">
          Password reset!
        </h2>
        <p className="mt-2 text-[13.5px] sm:text-[14px] text-slate-600 dark:text-slate-300 break-words">
          Your password has been successfully updated. Redirecting you to sign
          in...
        </p>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 max-w-full">
      {/* Single Clean Heading */}
      <div className="text-center mb-5 sm:mb-7">
        <h2 className="font-serif text-[24px] sm:text-[30px] font-bold text-[#0F172A] dark:text-white tracking-tight break-words">
          {t("auth_reset_title", "Set new password")}
        </h2>
        <p className="mt-1 text-[12.5px] sm:text-[13.5px] text-slate-500 dark:text-slate-400 font-normal break-words">
          {t("auth_reset_subtitle", "Choose a strong password with letters, numbers, and symbols.")}
        </p>
      </div>

      {formError && (
        <div className="mb-4 sm:mb-5 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 p-2.5 sm:p-3 text-[12.5px] sm:text-[13px] text-red-600 dark:text-red-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500 dark:text-red-400" />
          <span className="break-words">{formError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-3.5 sm:space-y-4 w-full min-w-0 max-w-full">
        {/* New Password */}
        <div className="w-full min-w-0">
          <label className="block text-[12.5px] sm:text-[13px] font-semibold text-slate-800 dark:text-slate-200 mb-1">
            {t("auth_password", "New Password")} <span className="text-red-500 dark:text-red-400">*</span>
          </label>
          <div className="relative w-full min-w-0">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none shrink-0" />
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={data.password}
              onChange={(e) => {
                setData((p) => ({ ...p, password: e.target.value }));
                if (errors.password)
                  setErrors((p) => ({ ...p, password: undefined }));
              }}
              placeholder="Create a new password"
              className={`w-full min-w-0 box-border rounded-xl border ${
                errors.password
                  ? "border-red-400 bg-red-50/30 dark:bg-red-950/20"
                  : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/90 hover:border-slate-400 dark:hover:border-slate-600"
              } py-2.5 pl-10 pr-10 text-[13.5px] text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white focus:dark:bg-slate-800 focus:border-[#4355CC] dark:focus:border-indigo-500 focus:ring-2 focus:ring-[#4355CC]/10 dark:focus:ring-indigo-500/20 focus:outline-none shadow-sm transition-all`}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer shrink-0"
              tabIndex={-1}
            >
              {showPassword ? (
                <Eye className="w-4 h-4" />
              ) : (
                <EyeOff className="w-4 h-4" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-[11.5px] sm:text-[12px] font-medium text-red-500 dark:text-red-400 flex items-center gap-1 break-words">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errors.password}</span>
            </p>
          )}
        </div>

        {/* Confirm New Password */}
        <div className="w-full min-w-0">
          <label className="block text-[12.5px] sm:text-[13px] font-semibold text-slate-800 dark:text-slate-200 mb-1">
            {t("auth_confirm_password", "Confirm New Password")} <span className="text-red-500 dark:text-red-400">*</span>
          </label>
          <div className="relative w-full min-w-0">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none shrink-0" />
            <input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              value={data.confirmPassword}
              onChange={(e) => {
                setData((p) => ({ ...p, confirmPassword: e.target.value }));
                if (errors.confirmPassword)
                  setErrors((p) => ({ ...p, confirmPassword: undefined }));
              }}
              placeholder="Re-enter your new password"
              className={`w-full min-w-0 box-border rounded-xl border ${
                errors.confirmPassword
                  ? "border-red-400 bg-red-50/30 dark:bg-red-950/20"
                  : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/90 hover:border-slate-400 dark:hover:border-slate-600"
              } py-2.5 pl-10 pr-10 text-[13.5px] text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white focus:dark:bg-slate-800 focus:border-[#4355CC] dark:focus:border-indigo-500 focus:ring-2 focus:ring-[#4355CC]/10 dark:focus:ring-indigo-500/20 focus:outline-none shadow-sm transition-all`}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer shrink-0"
              tabIndex={-1}
            >
              {showConfirmPassword ? (
                <Eye className="w-4 h-4" />
              ) : (
                <EyeOff className="w-4 h-4" />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="mt-1 text-[11.5px] sm:text-[12px] font-medium text-red-500 dark:text-red-400 flex items-center gap-1 break-words">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errors.confirmPassword}</span>
            </p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full min-w-0 flex items-center justify-center gap-2 rounded-xl bg-[#4355CC] hover:bg-[#3644A8] dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white py-3 text-[14px] font-semibold tracking-wide shadow-[0_4px_14px_rgba(67,85,204,0.35)] transition-all cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed mt-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
              <span className="truncate">{t("auth_resetting_password", "Resetting password...")}</span>
            </>
          ) : (
            <span className="truncate">{t("auth_reset_btn", "Reset password")}</span>
          )}
        </button>

        {/* Back to sign in */}
        <div className="text-center pt-2">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-[13.5px] font-semibold text-[#4355CC] dark:text-indigo-400 hover:underline"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" /> {t("auth_back_to_sign_in", "Back to sign in")}
          </Link>
        </div>
      </form>
    </div>
  );
};
