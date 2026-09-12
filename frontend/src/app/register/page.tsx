import { RegisterForm } from "@/features/auth/RegisterForm";
import Link from "next/link";
import { Shield, Users, Zap } from "lucide-react";
import { AuthHeaderControls } from "@/components/auth/AuthHeaderControls";

export const metadata = {
  title: "Create Account | EmpSphere",
  description:
    "Join thousands of modern teams who use EmpSphere to manage tasks with absolute clarity.",
};

export default function RegisterPage() {
  return (
    <main className="relative min-h-screen w-full min-w-0 max-w-full bg-gradient-to-br from-[#D1E2F2] via-[#DCE8F5] to-[#CCDDF0] dark:from-[#0B0F17] dark:via-[#0F172A] dark:to-[#0B0F17] text-slate-900 dark:text-slate-100 flex flex-col justify-between py-2.5 px-2.5 xs:py-3.5 xs:px-4 sm:py-4 sm:px-6 lg:py-6 lg:px-8 overflow-x-hidden transition-colors duration-200 box-border">
      {/* Soft Ambient Background Elements (Decorative) */}
      <div
        aria-hidden="true"
        className="absolute top-0 left-0 w-96 h-96 bg-blue-300/25 dark:bg-blue-600/10 rounded-full blur-3xl pointer-events-none"
      />
      <div
        aria-hidden="true"
        className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-200/30 dark:bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"
      />

      {/* Top Controls Header (Language Selector, Dark Mode Toggle, Login Link) */}
      <div className="absolute top-3.5 right-3.5 sm:top-5 sm:right-6 lg:top-6 lg:right-8 z-20">
        <AuthHeaderControls portalLink="/login" portalLabel="Already Registered? Login" />
      </div>

      {/* Container */}
      <div className="relative z-10 w-full min-w-0 max-w-[1240px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center my-auto pt-10 sm:pt-12 lg:pt-0 pb-2">
        {/* =======================================================
            LEFT COLUMN (Storytelling & Features - Desktop Only)
        ======================================================= */}
        <section
          aria-label="About EmpSphere"
          className="hidden lg:flex lg:col-span-5 flex-col justify-center max-w-[480px] min-w-0"
        >
          {/* Brand Logo */}
          <div className="flex items-center gap-2.5 mb-3 sm:mb-4">
            <div className="relative flex items-center" aria-hidden="true">
              <div className="w-5 h-5 rounded-full bg-[#1E293B] dark:bg-slate-300" />
              <div className="w-5 h-5 rounded-full bg-[#4355CC] -ml-2 opacity-90 mix-blend-multiply dark:mix-blend-screen" />
            </div>
            <span className="text-[20px] font-black tracking-tight text-[#0F172A] dark:text-white">
              EmpSphere
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-[28px] sm:text-[34px] lg:text-[36px] font-extrabold text-[#0F172A] dark:text-white leading-[1.15] tracking-tight">
            Manage tasks with{" "}
            <span className="text-[#3644A8] dark:text-indigo-400 block">absolute clarity.</span>
          </h1>

          {/* Subtitle - High contrast readable text */}
          <p className="mt-2 text-[14px] text-slate-700 dark:text-slate-300 leading-relaxed font-medium max-w-[420px]">
            Join thousands of modern teams who use EmpSphere to align their
            organization, ship faster, and hit their goals.
          </p>

          {/* Feature Cards */}
          <div className="mt-4 space-y-2.5 max-w-[420px]">
            {/* Card 1 */}
            <div className="flex items-center gap-3.5 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-300 dark:border-slate-800 shadow-[0_2px_8px_-2px_rgba(15,23,42,0.04)] dark:shadow-[0_2px_12px_-2px_rgba(0,0,0,0.4)] hover:border-slate-400 dark:hover:border-slate-700 transition-all">
              <div
                aria-hidden="true"
                className="w-7 h-7 rounded-full bg-[#182235] dark:bg-indigo-950/70 border dark:border-indigo-800/60 flex items-center justify-center text-white shrink-0"
              >
                <Shield className="w-3.5 h-3.5 text-white dark:text-indigo-300" />
              </div>
              <span className="text-[13.5px] font-bold text-slate-900 dark:text-white">
                Enterprise-grade security
              </span>
            </div>

            {/* Card 2 */}
            <div className="flex items-center gap-3.5 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-300 dark:border-slate-800 shadow-[0_2px_8px_-2px_rgba(15,23,42,0.04)] dark:shadow-[0_2px_12px_-2px_rgba(0,0,0,0.4)] hover:border-slate-400 dark:hover:border-slate-700 transition-all">
              <div
                aria-hidden="true"
                className="w-7 h-7 rounded-full bg-[#182235] dark:bg-indigo-950/70 border dark:border-indigo-800/60 flex items-center justify-center text-white shrink-0"
              >
                <Users className="w-3.5 h-3.5 text-white dark:text-indigo-300" />
              </div>
              <span className="text-[13.5px] font-bold text-slate-900 dark:text-white">
                Seamless team collaboration
              </span>
            </div>

            {/* Card 3 */}
            <div className="flex items-center gap-3.5 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-300 dark:border-slate-800 shadow-[0_2px_8px_-2px_rgba(15,23,42,0.04)] dark:shadow-[0_2px_12px_-2px_rgba(0,0,0,0.4)] hover:border-slate-400 dark:hover:border-slate-700 transition-all">
              <div
                aria-hidden="true"
                className="w-7 h-7 rounded-full bg-[#182235] dark:bg-indigo-950/70 border dark:border-indigo-800/60 flex items-center justify-center text-white shrink-0"
              >
                <Zap className="w-3.5 h-3.5 text-white dark:text-indigo-300" />
              </div>
              <span className="text-[13.5px] font-bold text-slate-900 dark:text-white">
                Lightning fast performance
              </span>
            </div>
          </div>
        </section>

        {/* =======================================================
            RIGHT COLUMN (Form Card & Mobile Brand)
        ======================================================= */}
        <section
          aria-label="Registration Form Section"
          className="lg:col-span-7 flex flex-col items-center lg:items-end justify-center w-full min-w-0 max-w-full"
        >
          {/* Mobile Brand Logo Header (Visible only on < lg screens) */}
          <div className="flex lg:hidden items-center justify-center gap-2 mb-3 mt-10 sm:mt-12 lg:mt-0">
            <div className="relative flex items-center" aria-hidden="true">
              <div className="w-5 h-5 rounded-full bg-[#1E293B] dark:bg-slate-300" />
              <div className="w-5 h-5 rounded-full bg-[#4355CC] -ml-2 opacity-90 mix-blend-multiply dark:mix-blend-screen" />
            </div>
            <span className="text-[20px] font-black tracking-tight text-[#0F172A] dark:text-white">
              EmpSphere
            </span>
          </div>

          <div className="w-full min-w-0 max-w-full sm:max-w-[620px] bg-white dark:bg-slate-900/95 rounded-2xl sm:rounded-[22px] shadow-[0_12px_35px_-12px_rgba(15,23,42,0.08)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.6)] border border-slate-300 dark:border-slate-800 p-3 xs:p-4 sm:p-6 lg:py-5 lg:px-7 transition-all box-border">
            <RegisterForm />
          </div>
        </section>
      </div>

      {/* Page Footer - High Contrast WCAG AA compliant */}
      <footer className="w-full min-w-0 max-w-[1360px] mx-auto flex flex-col sm:flex-row items-center justify-between text-[11.5px] sm:text-[12.5px] text-slate-700 dark:text-slate-400 font-semibold pt-3 pb-1 gap-2 box-border">
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1">
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
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
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
