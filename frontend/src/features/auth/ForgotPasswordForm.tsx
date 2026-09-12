"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Loader2,
  KeyRound,
  RotateCcw,
  Edit3,
  Check,
  ShieldCheck,
} from "lucide-react";
import toast from "react-hot-toast";
import { validateEmail } from "@/lib/validation";
import { api, extractApiError } from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";
import { OtpInput } from "@/components/auth/OtpInput";

type ResetStep = "email" | "otp" | "password" | "success";

export const ForgotPasswordForm = () => {
  const router = useRouter();
  const { t } = useLanguage();

  // Step state
  const [step, setStep] = useState<ResetStep>("email");

  // Step 1: Email state
  const [email, setEmail] = useState("");
  const [isEmailTouched, setIsEmailTouched] = useState(false);
  const [emailError, setEmailError] = useState<string | undefined>();
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // Step 2: OTP state
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState<string | null>(null);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [isResending, setIsResending] = useState(false);

  // Step 3: Password state
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  // Countdown timer for OTP resend
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (step === "otp") {
      setCountdown(60);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [step]);

  // Real-time email validation
  const handleEmailChange = (val: string) => {
    setEmail(val);
    if (isEmailTouched || val.length > 2) {
      setIsEmailTouched(true);
      setEmailError(validateEmail(val));
    }
  };

  const handleEmailBlur = () => {
    setIsEmailTouched(true);
    setEmailError(validateEmail(email));
  };

  const isEmailValid = !validateEmail(email) && email.trim().length > 0;

  // STEP 1 SUBMISSION: Send OTP
  const handleSendEmailOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsEmailTouched(true);
    const err = validateEmail(email);
    setEmailError(err);
    if (err || !email.trim()) return;

    setIsSendingEmail(true);
    setOtpError(null);

    try {
      await api.post("/auth/forgot-password", { email: email.trim().toLowerCase() });
      toast.success("Verification code sent to your email!");
      setStep("otp");
      setOtp("");
    } catch (err) {
      const { message } = extractApiError(err);
      setEmailError(message);
    } finally {
      setIsSendingEmail(false);
    }
  };

  // STEP 2: Resend OTP
  const handleResendOtp = async () => {
    if (countdown > 0 || isResending) return;
    setIsResending(true);
    setOtpError(null);

    try {
      await api.post("/auth/resend-forgot-password-otp", {
        email: email.trim().toLowerCase(),
      });
      setCountdown(60);
      setOtp("");
      toast.success("A fresh 6-digit verification code has been dispatched!");
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      const { message } = extractApiError(err);
      setOtpError(message);
    } finally {
      setIsResending(false);
    }
  };

  // STEP 2 SUBMISSION: Verify OTP
  const handleVerifyOtp = async (codeToVerify?: string) => {
    const targetOtp = codeToVerify || otp;
    if (targetOtp.length !== 6) {
      setOtpError("Please enter all 6 digits of the verification code.");
      return;
    }

    setIsVerifyingOtp(true);
    setOtpError(null);

    try {
      await api.post("/auth/verify-reset-otp", {
        email: email.trim().toLowerCase(),
        otp: targetOtp.trim(),
      });
      toast.success("Verification code confirmed!");
      setStep("password");
    } catch (err) {
      const { message } = extractApiError(err);
      setOtpError(message);
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Auto-verify on 6th digit
  useEffect(() => {
    if (step === "otp" && otp.length === 6 && !isVerifyingOtp) {
      handleVerifyOtp(otp);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp]);

  // Password rules validation
  const rules = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
    match: confirmPassword.length > 0 && password === confirmPassword,
  };

  const isPasswordValid =
    rules.length &&
    rules.upper &&
    rules.lower &&
    rules.number &&
    rules.special &&
    rules.match;

  // STEP 3 SUBMISSION: Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid) {
      if (!rules.match) {
        setPasswordError("Passwords do not match.");
      } else {
        setPasswordError("Please satisfy all password security requirements.");
      }
      return;
    }

    setIsResettingPassword(true);
    setPasswordError(null);

    try {
      await api.post("/auth/reset-password", {
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
        password,
        confirmPassword,
      });

      setStep("success");
      toast.success("Password reset successfully!");
      // Auto-redirect to login after 3 seconds
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (err) {
      const { message } = extractApiError(err);
      setPasswordError(message);
    } finally {
      setIsResettingPassword(false);
    }
  };

  // ============================================================
  // STEP 4: SUCCESS SCREEN
  // ============================================================
  if (step === "success") {
    return (
      <div className="w-full min-w-0 max-w-full text-center py-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 shadow-sm animate-in zoom-in-90 duration-300">
          <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h2 className="mt-5 font-serif text-[26px] sm:text-[28px] font-bold text-[#0F172A] dark:text-white tracking-tight">
          Password Reset Complete!
        </h2>
        <p className="mt-2 text-[14px] leading-relaxed text-slate-600 dark:text-slate-300 max-w-[340px] mx-auto">
          Your account password has been successfully updated. You can now sign in with your new credentials.
        </p>

        <div className="mt-7">
          <Link
            href="/login"
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#4355CC] hover:bg-[#3644A8] dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white py-3 text-[14px] font-semibold tracking-wide shadow-[0_4px_14px_rgba(67,85,204,0.35)] transition-all cursor-pointer"
          >
            {t("auth_back_to_sign_in", "Proceed to Sign In")}
          </Link>
        </div>

        <p className="mt-4 text-[12px] text-slate-400 dark:text-slate-500">
          Redirecting to sign-in page automatically...
        </p>
      </div>
    );
  }

  // ============================================================
  // STEP 2: OTP VERIFICATION SCREEN
  // ============================================================
  if (step === "otp") {
    return (
      <div className="w-full min-w-0 max-w-full">
        {/* Step Indicator Header */}
        <div className="text-center mb-6">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/80 text-[#4355CC] dark:text-indigo-400">
            <KeyRound className="h-6 w-6" />
          </div>
          <h2 className="font-serif text-[26px] sm:text-[28px] font-bold text-[#0F172A] dark:text-white tracking-tight">
            Verify Email OTP
          </h2>
          <p className="mt-1.5 text-[13px] text-slate-500 dark:text-slate-400 font-normal">
            Enter the 6-digit code sent to your email
          </p>

          {/* Email badge with edit button */}
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[12.5px] text-slate-700 dark:text-slate-300">
            <span className="font-medium truncate max-w-[200px] sm:max-w-[260px]">{email}</span>
            <button
              type="button"
              onClick={() => {
                setStep("email");
                setOtpError(null);
              }}
              className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#4355CC] dark:text-indigo-400 hover:underline cursor-pointer"
              title="Change email address"
            >
              <Edit3 className="w-3 h-3" /> Change
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {otpError && (
          <div className="mb-5 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 p-3 text-[13px] text-red-600 dark:text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500 dark:text-red-400" />
            <span>{otpError}</span>
          </div>
        )}

        {/* 6-Digit Segmented OTP Input */}
        <div className="my-6">
          <OtpInput
            value={otp}
            onChange={(val) => {
              setOtp(val);
              if (otpError) setOtpError(null);
            }}
            error={!!otpError}
            disabled={isVerifyingOtp}
          />
        </div>

        {/* Verify Button */}
        <button
          type="button"
          onClick={() => handleVerifyOtp()}
          disabled={otp.length !== 6 || isVerifyingOtp}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#4355CC] hover:bg-[#3644A8] dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white py-3 text-[14px] font-semibold tracking-wide shadow-[0_4px_14px_rgba(67,85,204,0.35)] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isVerifyingOtp ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Verifying Code...</span>
            </>
          ) : (
            <span>Verify & Proceed</span>
          )}
        </button>

        {/* Resend Countdown & Button */}
        <div className="mt-5 text-center">
          {countdown > 0 ? (
            <p className="text-[13px] text-slate-500 dark:text-slate-400">
              Resend code in{" "}
              <span className="font-semibold font-mono text-slate-800 dark:text-slate-200">
                00:{countdown.toString().padStart(2, "0")}
              </span>
            </p>
          ) : (
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={isResending}
              className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#4355CC] dark:text-indigo-400 hover:underline cursor-pointer disabled:opacity-50"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isResending ? "animate-spin" : ""}`} />
              {isResending ? "Resending..." : "Didn't receive code? Resend Code"}
            </button>
          )}
        </div>

        {/* Back to Sign In */}
        <div className="text-center pt-5 mt-2 border-t border-slate-100 dark:border-slate-800">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#4355CC] dark:text-indigo-400 hover:underline"
          >
            <ArrowLeft className="h-4 w-4" /> {t("auth_back_to_sign_in", "Back to sign in")}
          </Link>
        </div>
      </div>
    );
  }

  // ============================================================
  // STEP 3: SET NEW PASSWORD SCREEN
  // ============================================================
  if (step === "password") {
    return (
      <div className="w-full">
        <div className="text-center mb-6">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/80 text-[#4355CC] dark:text-indigo-400">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h2 className="font-serif text-[26px] sm:text-[28px] font-bold text-[#0F172A] dark:text-white tracking-tight">
            Create New Password
          </h2>
          <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-400 font-normal">
            Choose a secure password to protect your account
          </p>
        </div>

        {passwordError && (
          <div className="mb-5 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 p-3 text-[13px] text-red-600 dark:text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500 dark:text-red-400" />
            <span>{passwordError}</span>
          </div>
        )}

        <form onSubmit={handleResetPassword} noValidate className="space-y-4">
          {/* New Password */}
          <div>
            <label className="block text-[13px] font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
              New Password <span className="text-red-500 dark:text-red-400">*</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (passwordError) setPasswordError(null);
                }}
                placeholder="Enter minimum 8 characters"
                className="w-full min-w-0 box-border rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/90 hover:border-slate-400 dark:hover:border-slate-600 py-2.5 pl-10 pr-10 text-[13.5px] text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white focus:dark:bg-slate-800 focus:border-[#4355CC] dark:focus:border-indigo-500 focus:ring-2 focus:ring-[#4355CC]/10 dark:focus:ring-indigo-500/20 focus:outline-none shadow-sm transition-all"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
                tabIndex={-1}
              >
                {showPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-[13px] font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
              Confirm New Password <span className="text-red-500 dark:text-red-400">*</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (passwordError) setPasswordError(null);
                }}
                placeholder="Re-enter your new password"
                className={`w-full min-w-0 box-border rounded-xl border ${
                  confirmPassword && !rules.match
                    ? "border-red-400 bg-red-50/30 dark:bg-red-950/20"
                    : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/90 hover:border-slate-400 dark:hover:border-slate-600"
                } py-2.5 pl-10 pr-10 text-[13.5px] text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white focus:dark:bg-slate-800 focus:border-[#4355CC] dark:focus:border-indigo-500 focus:ring-2 focus:ring-[#4355CC]/10 dark:focus:ring-indigo-500/20 focus:outline-none shadow-sm transition-all`}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
                tabIndex={-1}
              >
                {showConfirmPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Real-time Checklist */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2 text-[12px]">
            <p className="font-semibold text-slate-700 dark:text-slate-300 text-[12.5px] mb-1.5">
              Password Requirements:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              <span className={`flex items-center gap-1.5 ${rules.length ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-slate-500 dark:text-slate-400"}`}>
                <Check className={`w-3.5 h-3.5 ${rules.length ? "opacity-100" : "opacity-30"}`} />
                At least 8 characters
              </span>
              <span className={`flex items-center gap-1.5 ${rules.upper ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-slate-500 dark:text-slate-400"}`}>
                <Check className={`w-3.5 h-3.5 ${rules.upper ? "opacity-100" : "opacity-30"}`} />
                Uppercase letter (A-Z)
              </span>
              <span className={`flex items-center gap-1.5 ${rules.lower ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-slate-500 dark:text-slate-400"}`}>
                <Check className={`w-3.5 h-3.5 ${rules.lower ? "opacity-100" : "opacity-30"}`} />
                Lowercase letter (a-z)
              </span>
              <span className={`flex items-center gap-1.5 ${rules.number ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-slate-500 dark:text-slate-400"}`}>
                <Check className={`w-3.5 h-3.5 ${rules.number ? "opacity-100" : "opacity-30"}`} />
                One number (0-9)
              </span>
              <span className={`flex items-center gap-1.5 ${rules.special ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-slate-500 dark:text-slate-400"}`}>
                <Check className={`w-3.5 h-3.5 ${rules.special ? "opacity-100" : "opacity-30"}`} />
                Special character (@#$!%*)
              </span>
              <span className={`flex items-center gap-1.5 ${rules.match ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-slate-500 dark:text-slate-400"}`}>
                <Check className={`w-3.5 h-3.5 ${rules.match ? "opacity-100" : "opacity-30"}`} />
                Passwords match
              </span>
            </div>
          </div>

          {/* Submit Reset Button */}
          <button
            type="submit"
            disabled={!isPasswordValid || isResettingPassword}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#4355CC] hover:bg-[#3644A8] dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white py-3 text-[14px] font-semibold tracking-wide shadow-[0_4px_14px_rgba(67,85,204,0.35)] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-3"
          >
            {isResettingPassword ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Updating Password...</span>
              </>
            ) : (
              <span>Reset Password</span>
            )}
          </button>
        </form>

        {/* Back to sign in */}
        <div className="text-center pt-4">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#4355CC] dark:text-indigo-400 hover:underline"
          >
            <ArrowLeft className="h-4 w-4" /> {t("auth_back_to_sign_in", "Back to sign in")}
          </Link>
        </div>
      </div>
    );
  }

  // ============================================================
  // STEP 1: ENTER EMAIL SCREEN (DEFAULT)
  // ============================================================
  return (
    <div className="w-full min-w-0 max-w-full">
      {/* Clean Heading */}
      <div className="text-center mb-7">
        <h2 className="font-serif text-[28px] sm:text-[32px] font-bold text-[#0F172A] dark:text-white tracking-tight">
          {t("auth_forgot_title", "Forgot password?")}
        </h2>
        <p className="mt-1.5 text-[13.5px] text-slate-500 dark:text-slate-400 font-normal">
          Enter your registered email and we&apos;ll send you a 6-digit verification code.
        </p>
      </div>

      <form onSubmit={handleSendEmailOtp} noValidate className="space-y-4">
        {/* Work Email */}
        <div>
          <label className="block text-[13px] font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
            {t("auth_work_email", "Email Address")} <span className="text-red-500 dark:text-red-400">*</span>
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
            <input
              type="email"
              name="email"
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              onBlur={handleEmailBlur}
              placeholder="you@company.com"
              className={`w-full min-w-0 box-border rounded-xl border ${
                isEmailTouched && emailError
                  ? "border-red-400 dark:border-red-500/80 bg-red-50/40 dark:bg-red-950/20 text-red-900 dark:text-red-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/10"
                  : isEmailTouched && isEmailValid
                    ? "border-emerald-500/60 dark:border-emerald-500/50 bg-white dark:bg-slate-800/90 text-slate-800 dark:text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
                    : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/90 hover:border-slate-400 dark:hover:border-slate-600 text-slate-800 dark:text-white focus:border-[#4355CC] dark:focus:border-indigo-500 focus:ring-2 focus:ring-[#4355CC]/10 dark:focus:ring-indigo-500/20"
              } py-2.5 pl-10 pr-10 text-[13.5px] placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none shadow-sm transition-all`}
              autoComplete="email"
            />
            {isEmailTouched && isEmailValid && (
              <Check className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600 dark:text-emerald-400 pointer-events-none" />
            )}
          </div>

          {/* Real-time Inline Error Feedback */}
          {isEmailTouched && emailError && (
            <p className="mt-1.5 text-[12px] font-medium text-red-600 dark:text-red-400 flex items-center gap-1.5 animate-in fade-in-50 duration-150">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{emailError}</span>
            </p>
          )}
        </div>

        {/* Submit Button - Disabled until email is valid */}
        <button
          type="submit"
          disabled={!isEmailValid || isSendingEmail}
          className={`w-full flex items-center justify-center gap-2 rounded-xl py-3 text-[14px] font-semibold tracking-wide transition-all mt-2 ${
            !isEmailValid || isSendingEmail
              ? "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-70"
              : "bg-[#4355CC] hover:bg-[#3644A8] dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white shadow-[0_4px_14px_rgba(67,85,204,0.35)] cursor-pointer active:scale-[0.99]"
          }`}
        >
          {isSendingEmail ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Sending Code...</span>
            </>
          ) : (
            <span>Send Verification Code</span>
          )}
        </button>

        {/* Back to sign in */}
        <div className="text-center pt-2">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-[13.5px] font-semibold text-[#4355CC] dark:text-indigo-400 hover:underline"
          >
            <ArrowLeft className="h-4 w-4" /> {t("auth_back_to_sign_in", "Back to sign in")}
          </Link>
        </div>
      </form>
    </div>
  );
};
