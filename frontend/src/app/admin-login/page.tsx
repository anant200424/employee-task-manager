"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Shield, AlertCircle, ArrowLeft } from "lucide-react";
import { api, extractApiError, setAccessToken } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";

export default function AdminLoginPage() {
  const router = useRouter();
  const { setUser } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    document.title = "Admin Login | EmpSphere";
  }, []);

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};
    if (!email) {
      newErrors.email = "Email address is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Enter a valid email address";
    }
    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const res = await api.post("/auth/login", { email, password });
      const { accessToken, user } = res.data.data;

      if (user.role !== "admin") {
        setFormError("Access denied. Only administrators are allowed to log in here.");
        toast.error("Access denied. Admin privileges required.");
        setIsSubmitting(false);
        return;
      }

      setAccessToken(accessToken);
      setUser(user);
      toast.success("Admin login successful! Welcome to the Admin workspace.");
      router.push("/dashboard");
    } catch (err) {
      const { message } = extractApiError(err);
      setFormError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormFilled = Boolean(email.trim() !== "" && password.trim() !== "");
  const canSubmit = isFormFilled && !isSubmitting;

  return (
    <main className="relative min-h-screen w-full bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A] text-slate-200 flex flex-col justify-between p-6 sm:p-10 lg:p-14 overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#4355CC]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#3B82F6]/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 w-full max-w-[1200px] mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center">
            <div className="w-6 h-6 rounded-full bg-white" />
            <div className="w-6 h-6 rounded-full bg-[#4355CC] -ml-2.5 opacity-90 mix-blend-screen" />
          </div>
          <span className="text-[22px] font-bold tracking-tight text-white">
            EmpSphere
          </span>
        </div>
        <Link
          href="/login"
          className="flex items-center gap-2 text-[13.5px] font-semibold text-slate-400 hover:text-white transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Employee Login
        </Link>
      </header>

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-[490px] mx-auto my-auto flex flex-col items-center">
        {/* Shield Icon */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#4355CC] to-[#3B82F6] flex items-center justify-center text-white mb-6 shadow-[0_8px_30px_rgb(59,130,246,0.2)]">
          <Shield className="w-8 h-8" />
        </div>

        {/* Card Form */}
        <div className="w-full bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-[28px] p-8 sm:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
          <div className="text-center mb-8">
            <h2 className="text-[26px] font-bold text-white tracking-tight">
              Admin Portal
            </h2>
            <p className="mt-1.5 text-[13.5px] text-slate-400">
              Sign in with your administrator credentials
            </p>
          </div>

          {formError && (
            <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-[13px] text-red-400 flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Admin Email */}
            <div>
              <label className="block text-[13.5px] font-bold text-slate-300 mb-1.5">
                Admin Email <span className="text-[#3B82F6]">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors((p) => ({ ...p, email: undefined }));
                  }}
                  placeholder="admin@empsphere.com"
                  className={`w-full rounded-xl border-2 ${
                    errors.email
                      ? "border-red-500/50 bg-red-500/5"
                      : "border-white/10 bg-white/[0.02] hover:border-white/20"
                  } py-3 pl-11 pr-4 text-[14px] font-bold text-white placeholder:text-slate-500 focus:bg-white/[0.04] focus:border-[#4355CC] focus:ring-4 focus:ring-[#4355CC]/20 focus:outline-none shadow-2xs transition-all`}
                  autoComplete="email"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-[12px] font-bold text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-[13.5px] font-bold text-slate-300 mb-1.5">
                Password <span className="text-[#3B82F6]">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500 pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors((p) => ({ ...p, password: undefined }));
                  }}
                  placeholder="Enter admin password"
                  className={`w-full rounded-xl border-2 ${
                    errors.password
                      ? "border-red-500/50 bg-red-500/5"
                      : "border-white/10 bg-white/[0.02] hover:border-white/20"
                  } py-3 pl-11 pr-11 text-[14px] font-bold text-white placeholder:text-slate-500 focus:bg-white/[0.04] focus:border-[#4355CC] focus:ring-4 focus:ring-[#4355CC]/20 focus:outline-none shadow-2xs transition-all`}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
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
                <p className="mt-1 text-[12px] font-bold text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.password}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={!canSubmit}
                className={`group relative w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-[15px] font-extrabold text-white transition-all overflow-hidden ${
                  !canSubmit
                    ? "bg-[#4355CC]/40 text-white/70 cursor-not-allowed opacity-50 backdrop-blur-xs pointer-events-none shadow-none"
                    : "bg-gradient-to-r from-[#4355CC] to-[#3B82F6] hover:from-[#3747B8] hover:to-[#2563EB] hover:shadow-[0_8px_20px_-6px_rgba(67,85,204,0.5)] active:scale-[0.99] cursor-pointer"
                }`}
              >
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer" />
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Enter Portal</span>
                    <ArrowRight className="w-4.5 h-4.5 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-[1200px] mx-auto text-center text-[12px] text-slate-500 pt-8">
        <span>© 2026 EmpSphere Inc. Admin Workspace Security Enforced.</span>
      </footer>
    </main>
  );
}
