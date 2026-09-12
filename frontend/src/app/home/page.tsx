"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { AuthHeaderControls } from "@/components/auth/AuthHeaderControls";
import {
  Shield,
  Users,
  Zap,
  BarChart3,
  CheckCircle2,
  Lock,
  ArrowRight,
  Activity,
  Globe2,
  Layers,
  Star,
  TrendingUp,
  Clock,
  ShieldCheck,
  Sparkles,
  Check,
} from "lucide-react";

export default function HomePage() {
  const { isAuthenticated, isLoading } = useAuth();
  const { t, language } = useLanguage();
  const router = useRouter();
  const [activeCard, setActiveCard] = useState<"employee" | "admin" | null>(null);
  const [scrolled, setScrolled] = useState(false);

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    document.title = `EmpSphere — ${t("home_hero_title2", "Enterprise Workforce Platform")}`;
  }, [language, t]);

  const navItems = [
    { key: "features", label: t("home_nav_features", "Features") },
    { key: "security", label: t("home_nav_security", "Security") },
    { key: "analytics", label: t("home_nav_analytics", "Analytics") },
  ];

  const stats = [
    { value: "99.9%", label: t("home_stat_uptime", "Uptime SLA"), icon: Activity },
    { value: "50K+", label: t("home_stat_users", "Active Users"), icon: Users },
    { value: "2M+", label: t("home_stat_tasks", "Tasks Managed"), icon: CheckCircle2 },
    { value: "150+", label: t("home_stat_countries", "Countries"), icon: Globe2 },
  ];

  const features = [
    {
      icon: Shield,
      title: t("home_feat1_title", "Enterprise Security"),
      desc: t("home_feat1_desc", "Military-grade JWT auth, RBAC, OTP verification, and rate limiting out of the box."),
      color: "from-violet-500 to-purple-600",
      glow: "shadow-violet-500/25",
    },
    {
      icon: BarChart3,
      title: t("home_feat2_title", "Real-Time Analytics"),
      desc: t("home_feat2_desc", "6-month growth charts, productivity scores, and live workforce metrics for leadership."),
      color: "from-blue-500 to-indigo-600",
      glow: "shadow-blue-500/25",
    },
    {
      icon: Users,
      title: t("home_feat3_title", "Team Management"),
      desc: t("home_feat3_desc", "Role-based portals for Super Admin, System Admin, Admin, Manager, and Employees."),
      color: "from-emerald-500 to-teal-600",
      glow: "shadow-emerald-500/25",
    },
    {
      icon: Zap,
      title: t("home_feat4_title", "Lightning Performance"),
      desc: t("home_feat4_desc", "Optimistic UI updates, instant token refresh, and background sync for zero-latency UX."),
      color: "from-amber-500 to-orange-600",
      glow: "shadow-amber-500/25",
    },
    {
      icon: Layers,
      title: t("home_feat5_title", "Full Task Lifecycle"),
      desc: t("home_feat5_desc", "Create, assign, track, review, complete and archive tasks with full audit trails."),
      color: "from-rose-500 to-pink-600",
      glow: "shadow-rose-500/25",
    },
    {
      icon: Lock,
      title: t("home_feat6_title", "Compliance Ready"),
      desc: t("home_feat6_desc", "Built-in audit logs, PAN/Aadhar/UAN fields, soft-delete, and data export for compliance."),
      color: "from-sky-500 to-cyan-600",
      glow: "shadow-sky-500/25",
    },
  ];

  const testimonials = [
    {
      name: "Aarav Sharma",
      role: "Senior Fullstack Architect",
      text: "EmpSphere transformed how our engineering team tracks deliverables. The real-time updates are seamless.",
      rating: 5,
    },
    {
      name: "Priya Patel",
      role: "Principal Product Designer",
      text: "Beautiful, intuitive, and fast. The dark mode and role-based dashboards are exactly what we needed.",
      rating: 5,
    },
    {
      name: "Vikram Nair",
      role: "Enterprise Growth Director",
      text: "The analytics suite gives our leadership team instant visibility into workforce productivity.",
      rating: 5,
    },
  ];

  return (
    <div className="min-h-screen bg-[#F4F6FA] dark:bg-[#080C14] text-slate-900 dark:text-white overflow-x-hidden transition-colors duration-200">

      {/* ── STICKY NAV ── */}
      <nav
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/90 dark:bg-[#0B0F18]/90 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80 shadow-sm"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 sm:px-10 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/home" className="flex items-center gap-2.5 group" aria-label="EmpSphere Home">
            <div className="relative flex items-center shrink-0">
              <div className="w-7 h-7 rounded-full bg-[#1E293B] dark:bg-indigo-500 group-hover:scale-105 transition-transform" />
              <div className="w-7 h-7 rounded-full bg-[#4355CC] dark:bg-indigo-300 -ml-3 opacity-90 mix-blend-multiply dark:mix-blend-screen group-hover:scale-105 transition-transform" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-[20px] font-black tracking-tight text-[#0F172A] dark:text-white">
                EmpSphere
              </span>
              <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
                Enterprise Platform
              </span>
            </div>
          </Link>

          {/* Nav Center Links */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.key}
                onClick={() => {
                  const el = document.getElementById(item.key);
                  if (el) {
                    el.scrollIntoView({ behavior: "smooth" });
                  }
                }}
                className="px-4 py-2 rounded-xl text-[13px] font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all cursor-pointer"
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Nav Right */}
          <div className="flex items-center gap-2">
            <AuthHeaderControls portalLink={undefined} portalLabel={undefined} />
            <Link
              href="/login"
              id="nav-employee-login"
              className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-bold text-[#5B5FEF] dark:text-indigo-400 border border-[#5B5FEF]/30 dark:border-indigo-500/30 hover:bg-[#5B5FEF]/8 dark:hover:bg-indigo-500/10 transition-all"
            >
              {t("home_nav_signin", "Sign In")}
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO SECTION ── */}
      <section className="relative pt-32 pb-24 px-6 sm:px-10 overflow-hidden">
        {/* Background Gradient Mesh */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-indigo-500/10 dark:bg-indigo-500/8 rounded-full blur-[120px]" />
          <div className="absolute top-20 right-1/4 w-[400px] h-[400px] bg-purple-500/10 dark:bg-purple-500/8 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 left-1/2 w-[500px] h-[300px] bg-blue-500/8 dark:bg-blue-500/6 rounded-full blur-[100px]" />
          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.025] dark:opacity-[0.04]"
            style={{
              backgroundImage: `linear-gradient(rgba(91,95,239,1) 1px, transparent 1px), linear-gradient(90deg, rgba(91,95,239,1) 1px, transparent 1px)`,
              backgroundSize: "60px 60px",
            }}
          />
        </div>

        <div className="relative max-w-5xl mx-auto text-center">
          {/* Top Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 text-[12px] font-bold text-indigo-600 dark:text-indigo-300 mb-8 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
            <span>{t("home_hero_badge", "Enterprise-Grade Workforce Management Platform")}</span>
          </div>

          {/* Hero Heading */}
          <h1 className="text-[44px] sm:text-[60px] lg:text-[74px] font-black text-[#0F172A] dark:text-white leading-[1.08] tracking-tight">
            {t("home_hero_title1", "The OS for your")}{" "}
            <span className="relative inline-block">
              <span className="relative z-10 bg-gradient-to-r from-[#5B5FEF] via-[#7C3AED] to-[#4355CC] bg-clip-text text-transparent">
                {t("home_hero_title2", "modern workforce")}
              </span>
              <span className="absolute bottom-1 left-0 right-0 h-3 bg-gradient-to-r from-indigo-200/60 to-purple-200/60 dark:from-indigo-900/40 dark:to-purple-900/40 blur-sm rounded-full" />
            </span>
          </h1>

          <p className="mt-6 text-[16.5px] sm:text-[18.5px] text-slate-600 dark:text-slate-300 font-medium leading-relaxed max-w-2xl mx-auto">
            {t(
              "home_hero_desc",
              "EmpSphere unifies task management, team analytics, payroll visibility, and role-based access into one beautifully designed enterprise workspace."
            )}
          </p>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/login"
              id="hero-signin-cta"
              className="group flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#5B5FEF] to-[#4355CC] text-white font-bold text-[15px] shadow-[0_8px_30px_rgba(91,95,239,0.35)] hover:shadow-[0_12px_40px_rgba(91,95,239,0.5)] hover:scale-[1.02] active:scale-[0.99] transition-all"
            >
              <Users className="w-4.5 h-4.5" />
              {t("home_hero_cta", "Sign In to Workspace")}
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── STATS STRIP ── */}
      <section className="py-10 px-6 sm:px-10 border-y border-slate-200/70 dark:border-slate-800/60 bg-white/60 dark:bg-[#0B0F18]/60 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map(({ value, label, icon: Icon }) => (
            <div key={label} className="flex flex-col items-center text-center gap-2 py-2">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800/60 flex items-center justify-center mb-1">
                <Icon className="w-5 h-5 text-[#5B5FEF] dark:text-indigo-400" />
              </div>
              <span className="text-[32px] font-black text-[#0F172A] dark:text-white leading-none">{value}</span>
              <span className="text-[12px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── DUAL LOGIN PORTALS ── */}
      <section id="portals" className="py-24 px-6 sm:px-10">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block text-[11px] font-black uppercase tracking-[0.2em] text-indigo-500 dark:text-indigo-400 mb-3">
              {t("home_portals_badge", "Access Portals")}
            </span>
            <h2 className="text-[36px] sm:text-[44px] font-black text-[#0F172A] dark:text-white leading-tight tracking-tight">
              {t("home_portals_title", "Choose your workspace")}
            </h2>
            <p className="mt-3 text-[15px] text-slate-500 dark:text-slate-400 font-medium max-w-xl mx-auto">
              {t("home_portals_desc", "Two dedicated portals. One unified platform. Secure, role-aware access for every team member.")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* ── Employee Portal Card ── */}
            <div
              id="employee-portal-card"
              onMouseEnter={() => setActiveCard("employee")}
              onMouseLeave={() => setActiveCard(null)}
              className={`group relative rounded-[28px] border overflow-hidden transition-all duration-300 cursor-pointer ${
                activeCard === "employee"
                  ? "border-[#5B5FEF]/50 shadow-[0_20px_60px_rgba(91,95,239,0.18)] -translate-y-1"
                  : "border-slate-200 dark:border-slate-800/80 shadow-md hover:shadow-lg"
              } bg-white dark:bg-[#0F172A]`}
            >
              <div className="h-1.5 w-full bg-gradient-to-r from-[#5B5FEF] via-[#6366F1] to-[#818CF8]" />

              <div className="p-8 sm:p-10">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#5B5FEF] to-[#4355CC] flex items-center justify-center mb-6 shadow-[0_8px_24px_rgba(91,95,239,0.3)] group-hover:scale-105 transition-transform">
                  <Users className="w-7 h-7 text-white" />
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800/50 text-[11px] font-black text-indigo-600 dark:text-indigo-300 uppercase tracking-wider mb-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {t("home_emp_portal_badge", "Employee Portal")}
                </div>

                <h3 className="text-[24px] font-black text-[#0F172A] dark:text-white tracking-tight mb-2">
                  {t("home_emp_portal_title", "Employee Sign In")}
                </h3>
                <p className="text-[14px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-6">
                  {t(
                    "home_emp_portal_desc",
                    "Access your tasks, view payslips, manage your profile, track deliverables, and collaborate with your team from one dashboard."
                  )}
                </p>

                <ul className="space-y-2.5 mb-8">
                  {[
                    t("home_emp_feat_1", "Personal task dashboard"),
                    t("home_emp_feat_2", "Payslip & salary overview"),
                    t("home_emp_feat_3", "Team collaboration hub"),
                    t("home_emp_feat_4", "Profile & document management"),
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2.5 text-[13px] font-semibold text-slate-700 dark:text-slate-300">
                      <span className="w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/login"
                  id="employee-portal-link"
                  className="group/btn flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#5B5FEF] to-[#4355CC] text-white font-bold text-[14px] shadow-[0_6px_20px_rgba(91,95,239,0.3)] hover:shadow-[0_10px_30px_rgba(91,95,239,0.45)] hover:from-[#4A4EDC] hover:to-[#3747B8] active:scale-[0.99] transition-all"
                >
                  {t("home_emp_btn", "Sign in as Employee")}
                  <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                </Link>

                <p className="mt-3 text-center text-[12px] text-slate-400 font-medium">
                  {t("home_emp_new_here", "New here?")}{" "}
                  <Link href="/register" className="text-[#5B5FEF] dark:text-indigo-400 hover:underline font-bold">
                    {t("home_emp_create_acc", "Create account")}
                  </Link>
                </p>
              </div>
            </div>

            {/* ── Admin Portal Card ── */}
            <div
              id="admin-portal-card"
              onMouseEnter={() => setActiveCard("admin")}
              onMouseLeave={() => setActiveCard(null)}
              className={`group relative rounded-[28px] border overflow-hidden transition-all duration-300 cursor-pointer ${
                activeCard === "admin"
                  ? "border-purple-500/50 shadow-[0_20px_60px_rgba(124,58,237,0.18)] -translate-y-1"
                  : "border-slate-200 dark:border-slate-800/80 shadow-md hover:shadow-lg"
              } bg-[#0B0F1A] dark:bg-[#080C14]`}
            >
              <div className="h-1.5 w-full bg-gradient-to-r from-purple-600 via-violet-500 to-indigo-500" />

              <div className="absolute top-20 right-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-10 left-0 w-40 h-40 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="relative p-8 sm:p-10">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-violet-700 flex items-center justify-center mb-6 shadow-[0_8px_24px_rgba(124,58,237,0.4)] group-hover:scale-105 transition-transform">
                  <Shield className="w-7 h-7 text-white" />
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-950/60 border border-purple-800/50 text-[11px] font-black text-purple-300 uppercase tracking-wider mb-4">
                  <Lock className="w-2.5 h-2.5 text-purple-400" />
                  {t("home_admin_portal_badge", "Restricted Access")}
                </div>

                <h3 className="text-[24px] font-black text-white tracking-tight mb-2">
                  {t("home_admin_portal_title", "Admin Portal")}
                </h3>
                <p className="text-[14px] text-slate-400 font-medium leading-relaxed mb-6">
                  {t(
                    "home_admin_portal_desc",
                    "Privileged access for Super Admins, System Admins, and Administrators to manage the entire organization."
                  )}
                </p>

                <ul className="space-y-2.5 mb-8">
                  {[
                    { label: t("home_admin_feat_1", "Super Admin — Full platform control"), color: "text-purple-400", bg: "bg-purple-950/60 border-purple-800/60" },
                    { label: t("home_admin_feat_2", "System Admin — Security & audit access"), color: "text-indigo-400", bg: "bg-indigo-950/60 border-indigo-800/60" },
                    { label: t("home_admin_feat_3", "Admin — User & task management"), color: "text-blue-400", bg: "bg-blue-950/60 border-blue-800/60" },
                    { label: t("home_admin_feat_4", "Audit logs, analytics & reporting"), color: "text-slate-300", bg: "bg-slate-800/60 border-slate-700/60" },
                  ].map(({ label, color, bg }) => (
                    <li key={label} className="flex items-center gap-2.5 text-[13px] font-semibold text-slate-300">
                      <span className={`w-5 h-5 rounded-full ${bg} border flex items-center justify-center shrink-0`}>
                        <CheckCircle2 className={`w-3 h-3 ${color}`} />
                      </span>
                      {label}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/login"
                  id="admin-portal-link"
                  className="group/btn flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-violet-600 text-white font-bold text-[14px] shadow-[0_6px_20px_rgba(124,58,237,0.35)] hover:shadow-[0_10px_30px_rgba(124,58,237,0.5)] hover:from-purple-500 hover:to-violet-500 active:scale-[0.99] transition-all"
                >
                  <Shield className="w-4 h-4" />
                  {t("home_admin_btn", "Sign In to Workspace")}
                  <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                </Link>

                <p className="mt-3 text-center text-[12px] text-slate-500 font-medium">
                  {t("home_admin_subtext", "Unified enterprise login for all workspace roles")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── NEW DEDICATED ANALYTICS SECTION ── */}
      <section
        id="analytics"
        className="scroll-mt-20 py-24 px-6 sm:px-10 bg-slate-50/70 dark:bg-[#070B12] border-y border-slate-200/80 dark:border-slate-800/80 relative overflow-hidden"
      >
        {/* Glow blur background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10">
          {/* Header */}
          <div className="text-center mb-14">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/60 text-[11px] font-black uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400 mb-3 shadow-sm">
              <BarChart3 className="w-3.5 h-3.5" />
              {t("home_analytics_badge", "Workforce Intelligence & Insights")}
            </span>
            <h2 className="text-[36px] sm:text-[44px] font-black text-[#0F172A] dark:text-white tracking-tight">
              {t("home_analytics_title", "Real-time analytics for modern leaders")}
            </h2>
            <p className="mt-3 text-[15px] text-slate-500 dark:text-slate-400 font-medium max-w-2xl mx-auto leading-relaxed">
              {t(
                "home_analytics_desc",
                "Gain deep visibility into team velocity, task completion efficiency, attendance trends, and organizational productivity."
              )}
            </p>
          </div>

          {/* 4 Metric Highlights Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
            {/* Card 1 */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200/80 dark:border-slate-800/80 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[12px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {t("home_analytics_stat1_lbl", "Task Completion Velocity")}
                </span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="text-[32px] font-black text-[#0F172A] dark:text-white leading-none">
                {t("home_analytics_stat1_val", "94.2%")}
              </div>
              <p className="mt-2 text-[12px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <span>↑</span> {t("home_analytics_stat1_sub", "+8.4% faster vs last month")}
              </p>
            </div>

            {/* Card 2 */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200/80 dark:border-slate-800/80 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[12px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {t("home_analytics_stat2_lbl", "Average Resolution Time")}
                </span>
                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-center text-[#5B5FEF] dark:text-indigo-400">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="text-[32px] font-black text-[#0F172A] dark:text-white leading-none">
                {t("home_analytics_stat2_val", "1.8 hrs")}
              </div>
              <p className="mt-2 text-[12px] font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                <span>⚡</span> {t("home_analytics_stat2_sub", "32% faster delivery time")}
              </p>
            </div>

            {/* Card 3 */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200/80 dark:border-slate-800/80 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[12px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {t("home_analytics_stat3_lbl", "Workforce Active Rate")}
                </span>
                <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800/60 flex items-center justify-center text-purple-600 dark:text-purple-400">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="text-[32px] font-black text-[#0F172A] dark:text-white leading-none">
                {t("home_analytics_stat3_val", "98.6%")}
              </div>
              <p className="mt-2 text-[12px] font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> {t("home_analytics_stat3_sub", "High engagement index")}
              </p>
            </div>

            {/* Card 4 */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200/80 dark:border-slate-800/80 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[12px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {t("home_analytics_stat4_lbl", "SLA Adherence Rate")}
                </span>
                <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="text-[32px] font-black text-[#0F172A] dark:text-white leading-none">
                {t("home_analytics_stat4_val", "99.4%")}
              </div>
              <p className="mt-2 text-[12px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <Check className="w-3 h-3" /> {t("home_analytics_stat4_sub", "Zero compliance violations")}
              </p>
            </div>
          </div>

          {/* Interactive Analytics Matrix Preview */}
          <div className="rounded-[28px] border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0B0F1A] shadow-xl overflow-hidden p-6 sm:p-10">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-6 mb-8 border-b border-slate-100 dark:border-slate-800/70 gap-4">
              <div>
                <h3 className="text-[20px] sm:text-[22px] font-black text-[#0F172A] dark:text-white tracking-tight">
                  {t("home_analytics_card_title", "Live Productivity Matrix")}
                </h3>
                <p className="text-[13px] text-slate-500 dark:text-slate-400 font-medium mt-1">
                  {t("home_analytics_card_sub", "Real-time organizational performance across departments")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 text-[11.5px] font-bold text-emerald-600 dark:text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  Live Syncing
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Left Column: Simulated Monthly Bar Graph */}
              <div className="lg:col-span-7 flex flex-col justify-between">
                <p className="text-[12px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-6">
                  6-Month Velocity Trend (Deliverables vs Target)
                </p>

                {/* Graph bars representation */}
                <div className="flex items-end justify-between gap-3 sm:gap-6 h-48 sm:h-56 pb-2 border-b border-slate-200 dark:border-slate-800">
                  {[
                    { month: "Jan", target: 65, achieved: 78 },
                    { month: "Feb", target: 70, achieved: 84 },
                    { month: "Mar", target: 75, achieved: 88 },
                    { month: "Apr", target: 78, achieved: 92 },
                    { month: "May", target: 82, achieved: 96 },
                    { month: "Jun", target: 85, achieved: 98 },
                  ].map((bar) => (
                    <div key={bar.month} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                      <div className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        {bar.achieved}%
                      </div>
                      <div className="w-full max-w-[36px] flex items-end justify-center gap-1 h-full">
                        {/* Target bar */}
                        <div
                          style={{ height: `${bar.target}%` }}
                          className="w-2 sm:w-2.5 bg-slate-200 dark:bg-slate-700/80 rounded-t-full transition-all"
                        />
                        {/* Achieved bar */}
                        <div
                          style={{ height: `${bar.achieved}%` }}
                          className="w-3.5 sm:w-4 bg-gradient-to-t from-[#5B5FEF] to-[#818CF8] rounded-t-full shadow-md transition-all group-hover:from-indigo-600 group-hover:to-purple-400"
                        />
                      </div>
                      <span className="text-[12px] font-bold text-slate-500 dark:text-slate-400 mt-2">
                        {bar.month}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Pulse highlights */}
                <div className="mt-6 space-y-2">
                  <div className="flex items-center gap-2 text-[12.5px] text-slate-600 dark:text-slate-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <span>{t("home_analytics_pulse1", "Sprint 14 velocity completed ahead of schedule")}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[12.5px] text-slate-600 dark:text-slate-300">
                    <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                    <span>{t("home_analytics_pulse2", "99.8% on-time milestone delivery across active tasks")}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[12.5px] text-slate-600 dark:text-slate-300">
                    <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />
                    <span>{t("home_analytics_pulse3", "Zero security flags detected in monthly automated audit")}</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Department Progress Meters */}
              <div className="lg:col-span-5 p-6 rounded-2xl bg-slate-50 dark:bg-[#070A11] border border-slate-200/80 dark:border-slate-800/80 space-y-5">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-bold text-[#0F172A] dark:text-white uppercase tracking-wider">
                    Department Efficiency
                  </span>
                  <span className="text-[11px] font-semibold text-slate-400">Current Sprint</span>
                </div>

                {/* Engineering */}
                <div>
                  <div className="flex justify-between text-[13px] font-semibold mb-1.5">
                    <span className="text-slate-700 dark:text-slate-200">{t("home_dept_eng", "Engineering")}</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">96%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full" style={{ width: "96%" }} />
                  </div>
                </div>

                {/* Product */}
                <div>
                  <div className="flex justify-between text-[13px] font-semibold mb-1.5">
                    <span className="text-slate-700 dark:text-slate-200">{t("home_dept_prod", "Product Design")}</span>
                    <span className="font-bold text-purple-600 dark:text-purple-400">93%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-purple-500 to-violet-600 rounded-full" style={{ width: "93%" }} />
                  </div>
                </div>

                {/* Operations */}
                <div>
                  <div className="flex justify-between text-[13px] font-semibold mb-1.5">
                    <span className="text-slate-700 dark:text-slate-200">{t("home_dept_ops", "Operations")}</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">91%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full" style={{ width: "91%" }} />
                  </div>
                </div>

                {/* HR */}
                <div>
                  <div className="flex justify-between text-[13px] font-semibold mb-1.5">
                    <span className="text-slate-700 dark:text-slate-200">{t("home_dept_hr", "People & HR")}</span>
                    <span className="font-bold text-amber-600 dark:text-amber-400">95%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-amber-500 to-orange-600 rounded-full" style={{ width: "95%" }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES GRID ── */}
      <section id="features" className="scroll-mt-20 py-24 px-6 sm:px-10 bg-white/60 dark:bg-[#0B0F18]/60">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block text-[11px] font-black uppercase tracking-[0.2em] text-indigo-500 dark:text-indigo-400 mb-3">
              {t("home_features_badge", "Platform Features")}
            </span>
            <h2 className="text-[36px] sm:text-[44px] font-black text-[#0F172A] dark:text-white tracking-tight">
              {t("home_features_title", "Everything your team needs")}
            </h2>
            <p className="mt-3 text-[15px] text-slate-500 dark:text-slate-400 font-medium max-w-xl mx-auto">
              {t("home_features_desc", "Built for scale, designed for clarity. EmpSphere brings every HR and productivity tool under one roof.")}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map(({ icon: Icon, title, desc, color, glow }) => (
              <div
                key={title}
                className={`group relative rounded-2xl border border-slate-200/80 dark:border-slate-800/60 bg-white dark:bg-[#0F172A] p-6 hover:border-transparent hover:shadow-xl ${glow} transition-all duration-300 hover:-translate-y-1`}
              >
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-105 transition-transform`}>
                  <Icon className="w-5.5 h-5.5 text-white" />
                </div>
                <h3 className="text-[15px] font-black text-[#0F172A] dark:text-white mb-2">{title}</h3>
                <p className="text-[13px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-24 px-6 sm:px-10">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block text-[11px] font-black uppercase tracking-[0.2em] text-indigo-500 dark:text-indigo-400 mb-3">
              {t("home_testi_badge", "Trusted by Teams")}
            </span>
            <h2 className="text-[36px] sm:text-[44px] font-black text-[#0F172A] dark:text-white tracking-tight">
              {t("home_testi_title", "Loved by thousands")}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {testimonials.map(({ name, role, text, rating }) => (
              <div
                key={name}
                className="rounded-2xl border border-slate-200/80 dark:border-slate-800/60 bg-white dark:bg-[#0F172A] p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center gap-0.5 mb-4">
                  {Array.from({ length: rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-[13.5px] text-slate-600 dark:text-slate-300 font-medium leading-relaxed mb-5">
                  &ldquo;{text}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#5B5FEF] to-[#4355CC] flex items-center justify-center text-white text-[12px] font-black shrink-0">
                    {name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-[#0F172A] dark:text-white">{name}</p>
                    <p className="text-[11px] text-slate-400 font-medium">{role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA BANNER (SECURITY) ── */}
      <section id="security" className="scroll-mt-20 py-20 px-6 sm:px-10">
        <div className="max-w-4xl mx-auto">
          <div className="relative rounded-[32px] overflow-hidden bg-gradient-to-br from-[#1E1B4B] via-[#312E81] to-[#1E1B4B] p-12 sm:p-16 text-center shadow-2xl">
            <div className="absolute top-0 left-1/4 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-[12px] font-bold text-indigo-200 mb-6">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                {t("home_cta_badge", "Get Started Today — Free")}
              </div>

              <h2 className="text-[36px] sm:text-[48px] font-black text-white leading-tight tracking-tight mb-4">
                {t("home_cta_title1", "Ready to transform")} <br className="hidden sm:block" />
                {t("home_cta_title2", "your workforce?")}
              </h2>
              <p className="text-[16px] text-indigo-200 font-medium mb-10 max-w-xl mx-auto">
                {t("home_cta_desc", "Join 50,000+ employees and teams who run on EmpSphere every day.")}
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/register"
                  id="cta-register"
                  className="group flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-white text-[#312E81] font-extrabold text-[15px] hover:bg-indigo-50 shadow-[0_8px_30px_rgba(255,255,255,0.2)] hover:shadow-[0_12px_40px_rgba(255,255,255,0.3)] active:scale-[0.99] transition-all"
                >
                  {t("home_cta_create", "Create Free Account")}
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  href="/login"
                  id="cta-login"
                  className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-white/10 border border-white/20 text-white font-bold text-[15px] hover:bg-white/15 active:scale-[0.99] transition-all"
                >
                  {t("home_cta_signin", "Sign In to Workspace")}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-slate-200/70 dark:border-slate-800/60 py-10 px-6 sm:px-10 bg-white/60 dark:bg-[#0B0F18]/60">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="relative flex items-center shrink-0">
              <div className="w-5 h-5 rounded-full bg-[#1E293B] dark:bg-indigo-500" />
              <div className="w-5 h-5 rounded-full bg-[#4355CC] dark:bg-indigo-300 -ml-2.5 opacity-90 mix-blend-multiply dark:mix-blend-screen" />
            </div>
            <span className="text-[16px] font-black text-[#0F172A] dark:text-white tracking-tight">EmpSphere</span>
          </div>

          <div className="flex items-center gap-5 text-[13px] font-semibold text-slate-500 dark:text-slate-400">
            <Link href="/login" className="hover:text-[#5B5FEF] transition-colors">
              {t("home_footer_login", "Login")}
            </Link>
            <Link href="/register" className="hover:text-[#5B5FEF] transition-colors">
              {t("home_footer_register", "Register")}
            </Link>
            <Link href="/forgot-password" className="hover:text-[#5B5FEF] transition-colors">
              {t("home_footer_forgot", "Forgot Password")}
            </Link>
          </div>

          <p className="text-[12px] text-slate-400 font-medium">
            {t("home_footer_rights", "© 2026 EmpSphere Inc. All rights reserved.")}
          </p>
        </div>
      </footer>

    </div>
  );
}
