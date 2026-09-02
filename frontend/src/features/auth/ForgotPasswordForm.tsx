"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, MailCheck, AlertCircle, Loader2 } from "lucide-react";
import { validateEmail } from "@/lib/validation";
import { api, extractApiError } from "@/lib/api";

export const ForgotPasswordForm = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const emailErr = validateEmail(email);
    setError(emailErr);
    if (emailErr) return;

    setIsSubmitting(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setIsSent(true);
    } catch (err) {
      const { message } = extractApiError(err);
      setFormError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSent) {
    return (
      <div className="text-center py-2">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 border border-emerald-300">
          <MailCheck className="h-7 w-7 text-emerald-600" />
        </div>
        <h2 className="mt-5 font-serif text-[26px] font-bold text-[#0F172A] tracking-tight">
          Check your inbox
        </h2>
        <p className="mt-2 text-[14px] leading-relaxed text-slate-600">
          If an account exists for{" "}
          <span className="font-semibold text-slate-800">{email}</span>,
          we&apos;ve sent a link to reset your password. The link expires in 30
          minutes.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-flex items-center gap-2 text-[13.5px] font-semibold text-[#4355CC] hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Single Clean Heading */}
      <div className="text-center mb-7">
        <h2 className="font-serif text-[28px] sm:text-[32px] font-bold text-[#0F172A] tracking-tight">
          Forgot password?
        </h2>
        <p className="mt-1.5 text-[13.5px] text-slate-500 font-normal">
          Enter the email linked to your account and we&apos;ll send you a reset
          link.
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
            Email Address <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="email"
              name="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError(undefined);
              }}
              placeholder="you@company.com"
              className={`w-full rounded-xl border ${
                error
                  ? "border-red-400 bg-red-50/30"
                  : "border-slate-300 bg-white hover:border-slate-400"
              } py-2.5 pl-10 pr-3.5 text-[13.5px] text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-[#4355CC] focus:ring-2 focus:ring-[#4355CC]/10 focus:outline-none shadow-sm transition-all`}
              autoComplete="email"
            />
          </div>
          {error && (
            <p className="mt-1 text-[12px] font-medium text-red-500 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {error}
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
              <span>Sending link...</span>
            </>
          ) : (
            <span>Send reset link</span>
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
