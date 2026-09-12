import { LoginForm } from "@/features/auth/LoginForm";
import Link from "next/link";
import { Shield, Users, Zap } from "lucide-react";
import { AuthHeaderControls } from "@/components/auth/AuthHeaderControls";

export const metadata = {
  title: "Login | EmpSphere",
  description: "Log in to your workspace and pick up where you left off.",
};

export default function LoginPage() {
  return (
    <main className="relative min-h-screen w-full min-w-0 max-w-full bg-gradient-to-br from-[#D1E2F2] via-[#DCE8F5] to-[#CCDDF0] dark:from-[#0B0F17] dark:via-[#0F172A] dark:to-[#0B0F17] text-slate-900 dark:text-slate-100 flex flex-col justify-between p-3 xs:p-5 sm:p-6 lg:p-12 overflow-x-hidden transition-colors duration-200 box-border">
      {/* Soft Ambient Background Elements (Decorative) */}
      <div
        aria-hidden="true"
        className="absolute top-0 left-0 w-96 h-96 bg-blue-300/25 dark:bg-blue-600/10 rounded-full blur-3xl pointer-events-none"
      />
      <div
        aria-hidden="true"
        className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-200/30 dark:bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"
      />

      {/* Top Controls Header (Language Selector, Dark Mode Toggle) */}
      <div className="absolute top-3 right-3 sm:top-5 sm:right-6 lg:top-8 lg:right-10 z-20 shrink-0">
        <AuthHeaderControls />
      </div>

      {/* Container */}
      <div className="relative z-10 w-full min-w-0 max-w-[1060px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center my-auto pt-12 sm:pt-14 lg:pt-0 pb-4">
        {/* =======================================================
            LEFT COLUMN (Storytelling & Features - Desktop Only)
        ======================================================= */}
        <section
          aria-label="About EmpSphere"
          className="hidden lg:flex lg:col-span-6 flex-col justify-center max-w-[480px] min-w-0"
        >
          {/* Brand Logo */}
          <div className="flex items-center gap-3 mb-10">
            <div className="relative flex items-center" aria-hidden="true">
              <div className="w-6 h-6 rounded-full bg-[#1E293B] dark:bg-slate-300" />
              <div className="w-6 h-6 rounded-full bg-[#4355CC] -ml-2.5 opacity-90 mix-blend-multiply dark:mix-blend-screen" />
            </div>
            <span className="text-[22px] font-black tracking-tight text-[#0F172A] dark:text-white">
              EmpSphere
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-[36px] sm:text-[44px] lg:text-[46px] font-extrabold text-[#0F172A] dark:text-white leading-[1.14] tracking-tight">
            Manage tasks with{" "}
            <span className="text-[#3644A8] dark:text-indigo-400 block">absolute clarity.</span>
          </h1>

          {/* Subtitle - High contrast readable text */}
          <p className="mt-4 text-[14.5px] text-slate-700 dark:text-slate-300 font-medium leading-relaxed max-w-[420px]">
            Join thousands of modern teams who use EmpSphere to align their
            organization, ship faster, and hit their goals.
          </p>

          {/* Feature Cards */}
          <div className="mt-7 space-y-3.5 max-w-[420px]">
            {/* Card 1 */}
            <div className="flex items-center gap-4 px-5 py-3.5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-300 dark:border-slate-800 shadow-[0_2px_8px_-2px_rgba(15,23,42,0.04)] dark:shadow-[0_2px_12px_-2px_rgba(0,0,0,0.4)] hover:border-slate-400 dark:hover:border-slate-700 transition-all">
              <div
                aria-hidden="true"
                className="w-9 h-9 rounded-full bg-[#182235] dark:bg-indigo-950/70 border dark:border-indigo-800/60 flex items-center justify-center text-white shrink-0"
              >
                <Shield className="w-4 h-4 text-white dark:text-indigo-300" />
              </div>
              <span className="text-[14px] font-bold text-slate-900 dark:text-white">
                Enterprise-grade security
              </span>
            </div>

            {/* Card 2 */}
            <div className="flex items-center gap-4 px-5 py-3.5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-300 dark:border-slate-800 shadow-[0_2px_8px_-2px_rgba(15,23,42,0.04)] dark:shadow-[0_2px_12px_-2px_rgba(0,0,0,0.4)] hover:border-slate-400 dark:hover:border-slate-700 transition-all">
              <div
                aria-hidden="true"
                className="w-9 h-9 rounded-full bg-[#182235] dark:bg-indigo-950/70 border dark:border-indigo-800/60 flex items-center justify-center text-white shrink-0"
              >
                <Users className="w-4 h-4 text-white dark:text-indigo-300" />
              </div>
              <span className="text-[14px] font-bold text-slate-900 dark:text-white">
                Seamless team collaboration
              </span>
            </div>

            {/* Card 3 */}
            <div className="flex items-center gap-4 px-5 py-3.5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-300 dark:border-slate-800 shadow-[0_2px_8px_-2px_rgba(15,23,42,0.04)] dark:shadow-[0_2px_12px_-2px_rgba(0,0,0,0.4)] hover:border-slate-400 dark:hover:border-slate-700 transition-all">
              <div
                aria-hidden="true"
                className="w-9 h-9 rounded-full bg-[#182235] dark:bg-indigo-950/70 border dark:border-indigo-800/60 flex items-center justify-center text-white shrink-0"
              >
                <Zap className="w-4 h-4 text-white dark:text-indigo-300" />
              </div>
              <span className="text-[14px] font-bold text-slate-900 dark:text-white">
                Lightning fast performance
              </span>
            </div>
          </div>
        </section>

        {/* =======================================================
            RIGHT COLUMN (Form Card & Mobile Brand)
        ======================================================= */}
        <section
          aria-label="Login Form Section"
          className="lg:col-span-6 flex flex-col items-center lg:items-end justify-center w-full min-w-0 max-w-full"
        >
          {/* Mobile Brand Logo Header (Visible only on < lg screens) */}
          <div className="flex lg:hidden items-center justify-center gap-2.5 mb-3 sm:mb-4">
            <div className="relative flex items-center shrink-0" aria-hidden="true">
              <div className="w-6 h-6 rounded-full bg-[#1E293B] dark:bg-slate-300" />
              <div className="w-6 h-6 rounded-full bg-[#4355CC] -ml-2.5 opacity-90 mix-blend-multiply dark:mix-blend-screen" />
            </div>
            <span className="text-[20px] sm:text-[22px] font-black tracking-tight text-[#0F172A] dark:text-white truncate">
              EmpSphere
            </span>
          </div>

          <div className="w-full min-w-0 max-w-full sm:max-w-[440px] lg:max-w-[470px] bg-white dark:bg-slate-900/95 rounded-2xl sm:rounded-[28px] shadow-[0_15px_40px_-15px_rgba(15,23,42,0.08)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.6)] border border-slate-300 dark:border-slate-800 p-3.5 xs:p-5 sm:p-8 lg:p-10 transition-all box-border">
            <LoginForm />
          </div>
        </section>
      </div>

      {/* Page Footer - High Contrast WCAG AA compliant */}
      <footer className="w-full min-w-0 max-w-[1360px] mx-auto flex flex-col sm:flex-row items-center justify-between text-[11.5px] sm:text-[12.5px] text-slate-700 dark:text-slate-400 font-semibold pt-4 sm:pt-6 pb-2 gap-2.5 sm:gap-4 box-border">
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5">
          <span>© 2026 EmpSphere Inc.</span>
          <Link
            href="/privacy"
            className="hover:text-slate-950 dark:hover:text-white hover:underline underline-offset-2 transition-colors focus-visible:outline-2 focus-visible:outline-[#4355CC] rounded-xs"
          >
            Privacy
          </Link>
          <Link
            href="/terms"
            className="hover:text-slate-950 dark:hover:text-white hover:underline underline-offset-2 transition-colors focus-visible:outline-2 focus-visible:outline-[#4355CC] rounded-xs"
          >
            Terms
          </Link>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5">
          <Link
            href="/help"
            className="hover:text-slate-950 dark:hover:text-white hover:underline underline-offset-2 transition-colors focus-visible:outline-2 focus-visible:outline-[#4355CC] rounded-xs"
          >
            Help Center
          </Link>
          <Link
            href="/contact"
            className="hover:text-slate-950 dark:hover:text-white hover:underline underline-offset-2 transition-colors focus-visible:outline-2 focus-visible:outline-[#4355CC] rounded-xs"
          >
            Contact Support
          </Link>
        </div>
      </footer>
    </main>
  );
}
