"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { Shield } from "lucide-react";
import { VerifyOtpForm } from "@/features/auth/VerifyOtpForm";

function VerifyOtpContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (!emailParam) {
      router.replace("/register");
    } else {
      setEmail(emailParam);
    }
  }, [searchParams, router]);

  if (!email) {
    return null; // Will redirect in useEffect
  }

  return (
    <main className="relative min-h-screen w-full bg-gradient-to-br from-[#D1E2F2] via-[#DCE8F5] to-[#CCDDF0] text-slate-800 flex flex-col justify-center items-center p-6 sm:p-10">
      {/* Soft Ambient Background Elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-300/25 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-200/30 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-[480px]">
        {/* Brand Logo Header */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="relative flex items-center">
            <div className="w-6 h-6 rounded-full bg-[#1E293B]" />
            <div className="w-6 h-6 rounded-full bg-[#4355CC] -ml-2.5 opacity-90 mix-blend-multiply" />
          </div>
          <span className="text-[22px] font-bold tracking-tight text-[#0F172A]">
            EmpSphere
          </span>
        </div>

        {/* Verification Card */}
        <div className="bg-white rounded-[24px] shadow-[0_15px_40px_-15px_rgba(15,23,42,0.08)] border border-slate-300 p-7 sm:p-9">
          <VerifyOtpForm email={email} />
        </div>

        {/* Footer info */}
        <div className="mt-8 flex items-center justify-center gap-2 text-[12.5px] font-medium text-slate-500">
          <Shield className="w-4 h-4 text-slate-400" />
          Secure verification powered by EmpSphere Auth
        </div>
      </div>
    </main>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={null}>
      <VerifyOtpContent />
    </Suspense>
  );
}
