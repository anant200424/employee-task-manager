"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { OtpInput } from "@/components/auth/OtpInput";
import { AlertCircle, Loader2, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";
import { api, extractApiError, setAccessToken } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

interface VerifyOtpFormProps {
  email: string;
}

export const VerifyOtpForm = ({ email }: VerifyOtpFormProps) => {
  const router = useRouter();
  const { setUser } = useAuth();

  const [emailOtp, setEmailOtp] = useState("");
  const [phoneOtp, setPhoneOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Timers
  const [emailCooldown, setEmailCooldown] = useState(30);
  const [phoneCooldown, setPhoneCooldown] = useState(30);
  const [expiryTime, setExpiryTime] = useState(5 * 60); // 5 minutes

  // Loaders for resend
  const [isResendingEmail, setIsResendingEmail] = useState(false);
  const [isResendingPhone, setIsResendingPhone] = useState(false);

  useEffect(() => {
    // Cooldown timers
    const timer = setInterval(() => {
      setEmailCooldown((prev) => Math.max(0, prev - 1));
      setPhoneCooldown((prev) => Math.max(0, prev - 1));
      setExpiryTime((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (emailOtp.length !== 6 || phoneOtp.length !== 6) {
      setError("Please enter both 6-digit verification codes.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await api.post("/auth/verify-otp", {
        email,
        emailOtp,
        phoneOtp,
      });

      if (response.data?.data?.user) {
        if (response.data?.data?.accessToken) {
          setAccessToken(response.data.data.accessToken);
        }
        setUser(response.data.data.user);
        toast.success("Account created and verified successfully!");
        router.push("/dashboard");
      }
    } catch (err) {
      setError(extractApiError(err).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendEmail = async () => {
    if (emailCooldown > 0 || isResendingEmail) return;
    setIsResendingEmail(true);
    setError(null);
    try {
      await api.post("/auth/resend-email-otp", { email });
      setEmailCooldown(30);
      setExpiryTime(5 * 60);
      setEmailOtp("");
      toast.success("A new email verification code has been dispatched!");
    } catch (err) {
      setError(extractApiError(err).message);
    } finally {
      setIsResendingEmail(false);
    }
  };

  const handleResendPhone = async () => {
    if (phoneCooldown > 0 || isResendingPhone) return;
    setIsResendingPhone(true);
    setError(null);
    try {
      await api.post("/auth/resend-phone-otp", { email });
      setPhoneCooldown(30);
      setExpiryTime(5 * 60);
      setPhoneOtp("");
      toast.success("A new mobile verification code has been dispatched!");
    } catch (err) {
      setError(extractApiError(err).message);
    } finally {
      setIsResendingPhone(false);
    }
  };

  // Auto-verify if both are exactly 6 digits
  useEffect(() => {
    if (emailOtp.length === 6 && phoneOtp.length === 6) {
      handleVerify();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emailOtp, phoneOtp]);

  const obfuscateEmail = (email: string) => {
    const [user, domain] = email.split("@");
    if (!user || !domain) return email;
    return `${user[0]}***@${domain}`;
  };

  return (
    <div className="w-full">
      <div className="text-center mb-6">
        <h2 className="font-serif text-[28px] sm:text-[32px] font-bold text-[#0F172A] tracking-tight">
          Verify your account
        </h2>
        <p className="mt-1.5 text-[13.5px] text-slate-500 font-normal leading-relaxed">
          We sent verification codes to your email and phone.
          <br />
          Codes expire in{" "}
          <strong className="text-red-500">{formatTime(expiryTime)}</strong>.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-3.5 text-[13px] text-red-600 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
          <span className="leading-snug">{error}</span>
        </div>
      )}

      <form onSubmit={handleVerify} className="space-y-8">
        {/* Email OTP Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-[13px] font-semibold text-slate-800">
              Email Verification
            </label>
            <span className="text-[12.5px] font-medium text-slate-500">
              {obfuscateEmail(email)}
            </span>
          </div>
          <OtpInput
            value={emailOtp}
            onChange={setEmailOtp}
            disabled={isSubmitting || expiryTime === 0}
          />
          <div className="text-right">
            <button
              type="button"
              disabled={
                emailCooldown > 0 || isResendingEmail || expiryTime === 0
              }
              onClick={handleResendEmail}
              className="text-[12.5px] font-semibold text-[#4355CC] disabled:text-slate-400 transition-colors"
            >
              {isResendingEmail
                ? "Sending..."
                : emailCooldown > 0
                  ? `Resend email in ${emailCooldown}s`
                  : "Resend Email Code"}
            </button>
          </div>
        </div>

        {/* Phone OTP Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-[13px] font-semibold text-slate-800">
              Phone Verification
            </label>
          </div>
          <OtpInput
            value={phoneOtp}
            onChange={setPhoneOtp}
            disabled={isSubmitting || expiryTime === 0}
          />
          <div className="text-right">
            <button
              type="button"
              disabled={
                phoneCooldown > 0 || isResendingPhone || expiryTime === 0
              }
              onClick={handleResendPhone}
              className="text-[12.5px] font-semibold text-[#4355CC] disabled:text-slate-400 transition-colors"
            >
              {isResendingPhone
                ? "Sending..."
                : phoneCooldown > 0
                  ? `Resend SMS in ${phoneCooldown}s`
                  : "Resend SMS Code"}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={
            isSubmitting ||
            emailOtp.length !== 6 ||
            phoneOtp.length !== 6 ||
            expiryTime === 0
          }
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#4355CC] py-3 text-[14.5px] font-semibold text-white shadow-[0_4px_12px_rgba(67,85,204,0.25)] hover:bg-[#3444A8] hover:shadow-[0_6px_16px_rgba(67,85,204,0.35)] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:bg-[#4355CC] transition-all"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Verifying...
            </>
          ) : (
            <>
              Complete Registration
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
};
