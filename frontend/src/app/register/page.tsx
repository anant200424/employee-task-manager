import { RegisterForm } from "@/features/auth/RegisterForm";
import Link from "next/link";
import { Shield, Users, Zap } from "lucide-react";

export const metadata = {
  title: "Create Account | EmpSphere",
  description:
    "Join thousands of modern teams who use EmpSphere to manage tasks with absolute clarity.",
};

export default function RegisterPage() {
  return (
    <main className="relative min-h-screen w-full bg-gradient-to-br from-[#D1E2F2] via-[#DCE8F5] to-[#CCDDF0] text-slate-800 flex flex-col justify-between py-2 px-4 sm:py-3 sm:px-6 lg:py-4 lg:px-8">
      {/* Soft Ambient Background Elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-300/25 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-200/30 rounded-full blur-3xl pointer-events-none" />

      {/* Container */}
      <div className="relative z-10 w-full max-w-[1240px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center my-auto">
        {/* =======================================================
            LEFT COLUMN (Storytelling & Features)
        ======================================================= */}
        <section className="lg:col-span-5 flex flex-col justify-center max-w-[480px]">
          {/* Brand Logo */}
          <div className="flex items-center gap-2.5 mb-3 sm:mb-4">
            <div className="relative flex items-center">
              <div className="w-5 h-5 rounded-full bg-[#1E293B]" />
              <div className="w-5 h-5 rounded-full bg-[#4355CC] -ml-2 opacity-90 mix-blend-multiply" />
            </div>
            <span className="text-[20px] font-bold tracking-tight text-[#0F172A]">
              EmpSphere
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-[28px] sm:text-[34px] lg:text-[36px] font-extrabold text-[#0F172A] leading-[1.15] tracking-tight">
            Manage tasks with{" "}
            <span className="text-[#4355CC] block">absolute clarity.</span>
          </h1>

          {/* Subtitle */}
          <p className="mt-2 text-[13.5px] text-slate-600 leading-relaxed max-w-[420px]">
            Join thousands of modern teams who use EmpSphere to align their
            organization, ship faster, and hit their goals.
          </p>

          {/* Feature Cards */}
          <div className="mt-4 space-y-2.5 max-w-[420px] hidden sm:block">
            {/* Card 1 */}
            <div className="flex items-center gap-3.5 px-4 py-2.5 rounded-xl bg-white border border-slate-300 shadow-[0_2px_8px_-2px_rgba(15,23,42,0.04)] hover:border-slate-400 transition-all">
              <div className="w-7 h-7 rounded-full bg-[#182235] flex items-center justify-center text-white shrink-0">
                <Shield className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-[13px] font-semibold text-slate-800">
                Enterprise-grade security
              </span>
            </div>

            {/* Card 2 */}
            <div className="flex items-center gap-3.5 px-4 py-2.5 rounded-xl bg-white border border-slate-300 shadow-[0_2px_8px_-2px_rgba(15,23,42,0.04)] hover:border-slate-400 transition-all">
              <div className="w-7 h-7 rounded-full bg-[#182235] flex items-center justify-center text-white shrink-0">
                <Users className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-[13px] font-semibold text-slate-800">
                Seamless team collaboration
              </span>
            </div>

            {/* Card 3 */}
            <div className="flex items-center gap-3.5 px-4 py-2.5 rounded-xl bg-white border border-slate-300 shadow-[0_2px_8px_-2px_rgba(15,23,42,0.04)] hover:border-slate-400 transition-all">
              <div className="w-7 h-7 rounded-full bg-[#182235] flex items-center justify-center text-white shrink-0">
                <Zap className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-[13px] font-semibold text-slate-800">
                Lightning fast performance
              </span>
            </div>
          </div>
        </section>

        {/* =======================================================
            RIGHT COLUMN (Form Card)
        ======================================================= */}
        <section className="lg:col-span-7 flex justify-center lg:justify-end">
          <div className="w-full max-w-[620px] bg-white rounded-[22px] shadow-[0_12px_35px_-12px_rgba(15,23,42,0.08)] border border-slate-300 p-5 sm:p-6 lg:py-4 lg:px-7">
            <RegisterForm />
          </div>
        </section>
      </div>

      {/* Page Footer */}
      <footer className="w-full max-w-[1360px] mx-auto flex flex-col sm:flex-row items-center justify-between text-[12px] text-slate-500 font-medium pt-1 gap-2 mt-1">
        <div className="flex items-center gap-5">
          <span>© 2026 EmpSphere Inc.</span>
          <Link
            href="/privacy"
            className="hover:text-slate-800 transition-colors"
          >
            Privacy
          </Link>
          <Link
            href="/terms"
            className="hover:text-slate-800 transition-colors"
          >
            Terms
          </Link>
        </div>
        <div className="flex items-center gap-4 mt-1 sm:mt-0">
          <Link href="/help" className="hover:text-slate-800 transition-colors">
            Help Center
          </Link>
          <Link
            href="/contact"
            className="hover:text-slate-800 transition-colors"
          >
            Contact Support
          </Link>
        </div>
      </footer>
    </main>
  );
}
