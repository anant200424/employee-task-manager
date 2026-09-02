import { LoginForm } from "@/features/auth/LoginForm";
import Link from "next/link";
import { Shield, Users, Zap } from "lucide-react";

export const metadata = {
  title: "Login | EmpSphere",
  description: "Log in to your workspace and pick up where you left off.",
};

export default function LoginPage() {
  return (
    <main className="relative min-h-screen w-full bg-gradient-to-br from-[#D1E2F2] via-[#DCE8F5] to-[#CCDDF0] text-slate-800 flex flex-col justify-between p-6 sm:p-10 lg:p-14">
      {/* Soft Ambient Background Elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-300/25 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-200/30 rounded-full blur-3xl pointer-events-none" />

      {/* Admin Portal Link */}
      <div className="absolute top-6 right-6 sm:top-10 sm:right-10 z-20">
        <Link
          href="/admin-login"
          className="flex items-center gap-2 rounded-xl bg-white/60 hover:bg-white/95 border border-slate-300/80 px-4 py-2 text-[13px] font-semibold text-[#4355CC] shadow-sm backdrop-blur-sm transition-all"
        >
          <Shield className="w-4 h-4" />
          <span>Admin Portal</span>
        </Link>
      </div>

      {/* Container */}
      <div className="relative z-10 w-full max-w-[1060px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center my-auto">
        {/* =======================================================
            LEFT COLUMN (Storytelling & Features)
        ======================================================= */}
        <section className="lg:col-span-6 flex flex-col justify-center max-w-[480px]">
          {/* Brand Logo */}
          <div className="flex items-center gap-3 mb-10">
            <div className="relative flex items-center">
              <div className="w-6 h-6 rounded-full bg-[#1E293B]" />
              <div className="w-6 h-6 rounded-full bg-[#4355CC] -ml-2.5 opacity-90 mix-blend-multiply" />
            </div>
            <span className="text-[22px] font-bold tracking-tight text-[#0F172A]">
              EmpSphere
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-[36px] sm:text-[44px] lg:text-[46px] font-extrabold text-[#0F172A] leading-[1.14] tracking-tight">
            Manage tasks with{" "}
            <span className="text-[#4355CC] block">absolute clarity.</span>
          </h1>

          {/* Subtitle */}
          <p className="mt-4 text-[14.5px] text-slate-600 leading-relaxed max-w-[420px]">
            Join thousands of modern teams who use EmpSphere to align their
            organization, ship faster, and hit their goals.
          </p>

          {/* Feature Cards */}
          <div className="mt-7 space-y-3.5 max-w-[420px]">
            {/* Card 1 */}
            <div className="flex items-center gap-4 px-5 py-3.5 rounded-2xl bg-white border border-slate-300 shadow-[0_2px_8px_-2px_rgba(15,23,42,0.04)] hover:border-slate-400 transition-all">
              <div className="w-9 h-9 rounded-full bg-[#182235] flex items-center justify-center text-white shrink-0">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <span className="text-[14px] font-semibold text-slate-800">
                Enterprise-grade security
              </span>
            </div>

            {/* Card 2 */}
            <div className="flex items-center gap-4 px-5 py-3.5 rounded-2xl bg-white border border-slate-300 shadow-[0_2px_8px_-2px_rgba(15,23,42,0.04)] hover:border-slate-400 transition-all">
              <div className="w-9 h-9 rounded-full bg-[#182235] flex items-center justify-center text-white shrink-0">
                <Users className="w-4 h-4 text-white" />
              </div>
              <span className="text-[14px] font-semibold text-slate-800">
                Seamless team collaboration
              </span>
            </div>

            {/* Card 3 */}
            <div className="flex items-center gap-4 px-5 py-3.5 rounded-2xl bg-white border border-slate-300 shadow-[0_2px_8px_-2px_rgba(15,23,42,0.04)] hover:border-slate-400 transition-all">
              <div className="w-9 h-9 rounded-full bg-[#182235] flex items-center justify-center text-white shrink-0">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="text-[14px] font-semibold text-slate-800">
                Lightning fast performance
              </span>
            </div>
          </div>
        </section>

        {/* =======================================================
            RIGHT COLUMN (Form Card)
        ======================================================= */}
        <section className="lg:col-span-6 flex justify-center lg:justify-end">
          <div className="w-full max-w-[490px] bg-white rounded-[28px] shadow-[0_20px_50px_-15px_rgba(15,23,42,0.08)] border border-slate-300 p-8 sm:p-10 lg:p-11">
            <LoginForm />
          </div>
        </section>
      </div>

      {/* Page Footer */}
      <footer className="w-full max-w-[1360px] mx-auto flex flex-col sm:flex-row items-center justify-between text-[13px] text-slate-500 font-medium pt-8 gap-4">
        <div className="flex items-center gap-6">
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
        <div className="flex items-center gap-6">
          <Link
            href="/privacy"
            className="hover:text-slate-800 transition-colors"
          >
            Privacy Policy
          </Link>
          <Link
            href="/terms"
            className="hover:text-slate-800 transition-colors"
          >
            Terms of Service
          </Link>
          <Link href="/help" className="hover:text-slate-800 transition-colors">
            Help Center
          </Link>
        </div>
      </footer>
    </main>
  );
}
