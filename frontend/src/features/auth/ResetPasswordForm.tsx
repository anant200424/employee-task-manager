"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2, ArrowLeft } from "lucide-react";
import { ResetPasswordFormData, FormErrors } from "@/types/auth";
import { validateResetPasswordForm } from "@/lib/validation";
import { api, extractApiError } from "@/lib/api";

export const ResetPasswordForm = ({ token }: { token: string }) => {
  const router = useRouter();
  const [data, setData] = useState<ResetPasswordFormData>({ password: "", confirmPassword: "" });
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
      <div className="text-center py-2">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 border border-emerald-300">
          <CheckCircle2 className="h-7 w-7 text-emerald-600" />
        </div>
        <h2 className="mt-5 font-serif text-[26px] font-bold text-[#0F172A] tracking-tight">
          Password reset!
        </h2>
        <p className="mt-2 text-[14px] text-slate-600">
          Your password has been successfully updated. Redirecting you to sign in...
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Single Clean Heading */}
      <div className="text-center mb-7">
        <h2 className="font-serif text-[28px] sm:text-[32px] font-bold text-[#0F172A] tracking-tight">
          Set new password
        </h2>
        <p className="mt-1.5 text-[13.5px] text-slate-500 font-normal">
          Choose a strong password with letters, numbers, and symbols.
        </p>
      </div>

      {formError && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-[13px] text-red-600 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{formError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* New Password */}
        <div>
          <label className="block text-[13px] font-semibold text-slate-800 mb-1.5">
            New Password <span className="text-red-500">*</span>
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
              placeholder="Create a new password"
              className={`w-full rounded-xl border ${
                errors.password
                  ? "border-red-400 bg-red-50/30"
                  : "border-slate-300 bg-white hover:border-slate-400"
              } py-2.5 pl-10 pr-10 text-[13.5px] text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-[#4355CC] focus:ring-2 focus:ring-[#4355CC]/10 focus:outline-none shadow-sm transition-all`}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-[12px] font-medium text-red-500 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.password}
            </p>
          )}
        </div>

        {/* Confirm New Password */}
        <div>
          <label className="block text-[13px] font-semibold text-slate-800 mb-1.5">
            Confirm New Password <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              value={data.confirmPassword}
              onChange={(e) => {
                setData((p) => ({ ...p, confirmPassword: e.target.value }));
                if (errors.confirmPassword) setErrors((p) => ({ ...p, confirmPassword: undefined }));
              }}
              placeholder="Re-enter your new password"
              className={`w-full rounded-xl border ${
                errors.confirmPassword
                  ? "border-red-400 bg-red-50/30"
                  : "border-slate-300 bg-white hover:border-slate-400"
              } py-2.5 pl-10 pr-10 text-[13.5px] text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-[#4355CC] focus:ring-2 focus:ring-[#4355CC]/10 focus:outline-none shadow-sm transition-all`}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              tabIndex={-1}
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="mt-1 text-[12px] font-medium text-red-500 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.confirmPassword}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#4355CC] hover:bg-[#3644A8] text-white py-3 text-[14px] font-semibold tracking-wide shadow-[0_4px_14px_rgba(67,85,204,0.35)] transition-all cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed mt-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Resetting password...</span>
            </>
          ) : (
            <span>Reset password</span>
          )}
        </button>

        {/* Back to sign in */}
        <div className="text-center pt-2">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-[13.5px] font-semibold text-[#4355CC] hover:underline"
          >
            <ArrowLeft className="h-4 w-4" /> Back to sign in
          </Link>
        </div>
      </form>
    </div>
  );
};
