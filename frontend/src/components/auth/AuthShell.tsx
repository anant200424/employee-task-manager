import { ReactNode } from "react";
import {
  ShieldCheck,
  Users,
  Zap,
  ArrowUpRight,
  Check,
} from "lucide-react";
import { BrandMark } from "./BrandMark";

interface AuthShellProps {
  children: ReactNode;
  eyebrow?: string;
  headline: string;
  highlightedHeadline?: string;
  subtext: string;
}

export const AuthShell = ({
  children,
  eyebrow = "EMPLOYEE WORKSPACE",
  headline,
  highlightedHeadline,
  subtext,
}: AuthShellProps) => {
  return (
    <main className="auth-ui min-h-screen bg-[#F4F6FC] text-[#172554]">
      <div className="relative min-h-screen overflow-hidden">

        {/* ================================
            BACKGROUND
        ================================= */}

        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {/* Soft purple glow */}
          <div className="absolute -left-40 -top-40 h-[520px] w-[520px] rounded-full bg-[#7C5CFC]/10 blur-3xl" />

          {/* Soft teal glow */}
          <div className="absolute -right-40 bottom-[-180px] h-[500px] w-[500px] rounded-full bg-[#16B8A6]/10 blur-3xl" />

          {/* Small purple circle */}
          <div className="absolute right-[8%] top-[9%] h-28 w-28 rounded-full border border-[#7C5CFC]/15" />

          {/* Small teal circle */}
          <div className="absolute bottom-[8%] left-[45%] h-24 w-24 rounded-full border border-[#16B8A6]/20" />

          {/* Light grid */}
          <div
            className="absolute inset-0 opacity-[0.35]"
            style={{
              backgroundImage: `
                linear-gradient(#DCE2EF 1px, transparent 1px),
                linear-gradient(90deg, #DCE2EF 1px, transparent 1px)
              `,
              backgroundSize: "64px 64px",
            }}
          />

          {/* Decorative dots */}
          <div
            className="absolute right-[5%] top-[4%] h-24 w-24 opacity-40"
            style={{
              backgroundImage: "radial-gradient(#7C5CFC 1.5px, transparent 1.5px)",
              backgroundSize: "12px 12px",
            }}
          />
        </div>

        {/* ================================
            MAIN LAYOUT
        ================================= */}

        <div className="relative z-10 mx-auto grid min-h-screen max-w-[1500px] lg:grid-cols-[45%_55%]">

          {/* ================================
              LEFT MARKETING SECTION
          ================================= */}

          <section className="hidden flex-col justify-between px-10 py-8 lg:flex xl:px-14">

            {/* Brand */}
            <div>
              <BrandMark variant="dark" />
            </div>

            {/* Main content */}
            <div className="max-w-[540px]">

              {/* Eyebrow */}
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#DCD8FF] bg-white/80 px-3.5 py-2 text-[11px] font-semibold tracking-wide text-[#5545D8] shadow-sm backdrop-blur">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#EEEAFE]">
                  <ArrowUpRight className="h-3 w-3" />
                </span>

                {eyebrow}
              </div>

              {/* Heading */}
              <h1 className="max-w-[540px] text-[48px] font-bold leading-[1.05] tracking-[-0.04em] text-[#14224A] xl:text-[54px]">

                {headline}

                {highlightedHeadline && (
                  <>
                    <br />

                    <span className="bg-gradient-to-r from-[#6046E8] via-[#6658F5] to-[#1EB5A7] bg-clip-text text-transparent">
                      {highlightedHeadline}
                    </span>
                  </>
                )}
              </h1>

              {/* Description */}
              <p className="mt-5 max-w-[500px] text-[15px] leading-7 text-[#5C6A83]">
                {subtext}
              </p>

              {/* Feature cards */}
              <div className="mt-8 space-y-3">

                <FeatureCard
                  icon={<ShieldCheck className="h-5 w-5" />}
                  iconClass="bg-[#EEEAFE] text-[#624DE7]"
                  title="Enterprise-grade security"
                  description="Secure access for every workspace"
                />

                <FeatureCard
                  icon={<Users className="h-5 w-5" />}
                  iconClass="bg-[#E6F8F5] text-[#159E8E]"
                  title="Seamless team collaboration"
                  description="Everything your team needs in one place"
                />

                <FeatureCard
                  icon={<Zap className="h-5 w-5" />}
                  iconClass="bg-[#FFF0E7] text-[#F47D38]"
                  title="Fast and simple onboarding"
                  description="Start working without unnecessary complexity"
                />

              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-[#DCE1EC] pt-4 text-[11px] text-[#71809A]">
              © {new Date().getFullYear()} Klyro Inc.
              <span className="mx-2">•</span>
              Terms & Conditions
              <span className="mx-2">•</span>
              Privacy Policy
            </div>
          </section>

          {/* ================================
              RIGHT FORM SECTION
          ================================= */}

          <section className="flex min-h-screen items-center justify-center px-4 py-6 sm:px-6 lg:px-8">

            <div className="w-full max-w-[570px]">

              {/* Card */}
              <div className="auth-card overflow-hidden rounded-[22px] border border-[#DCE1EB] bg-white shadow-[0_20px_60px_rgba(31,41,80,0.10)]">

                {/* Card Header */}
                <div className="border-b border-[#E6E9F0] px-6 py-6 sm:px-7 sm:py-7">

                  <div className="mb-3 flex items-center gap-2 text-[10px] font-bold tracking-[0.16em] text-[#6353D9]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#6353D9]" />
                    {eyebrow}
                  </div>

                  <h2 className="text-[28px] font-bold tracking-[-0.025em] text-[#172554]">
                    {getTitle(eyebrow)}
                  </h2>

                  <p className="mt-1.5 text-[12px] leading-5 text-[#71809A]">
                    {getDescription(eyebrow)}
                  </p>
                </div>

                {/* Form */}
                <div className="px-6 py-6 sm:px-7 sm:py-7">
                  {children}
                </div>
              </div>

              {/* Bottom links */}
              <div className="mt-4 flex items-center justify-center gap-4 text-[11px] text-[#7B879C]">
                <span>Security</span>
                <span className="text-[#CBD1DC]">•</span>
                <span>Help</span>
                <span className="text-[#CBD1DC]">•</span>
                <span>Contact Us</span>
              </div>

            </div>
          </section>
        </div>
      </div>
    </main>
  );
};


/* ==========================================
   FEATURE CARD
========================================== */

interface FeatureCardProps {
  icon: ReactNode;
  iconClass: string;
  title: string;
  description: string;
}

const FeatureCard = ({
  icon,
  iconClass,
  title,
  description,
}: FeatureCardProps) => {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[#E1E5EE] bg-white/80 px-4 py-3.5 shadow-[0_6px_20px_rgba(35,45,80,0.04)] backdrop-blur">

      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
      >
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold text-[#24304D]">
          {title}
        </p>

        <p className="mt-0.5 text-[11px] text-[#7A879C]">
          {description}
        </p>
      </div>

      <Check className="h-4 w-4 shrink-0 text-[#17B49F]" />
    </div>
  );
};


/* ==========================================
   CARD TITLE
========================================== */

const getTitle = (eyebrow: string) => {
  if (eyebrow.includes("LOGIN")) {
    return "Welcome back";
  }

  if (eyebrow.includes("PASSWORD")) {
    return "Reset your password";
  }

  return "Create your account";
};


/* ==========================================
   CARD DESCRIPTION
========================================== */

const getDescription = (eyebrow: string) => {
  if (eyebrow.includes("LOGIN")) {
    return "Sign in to continue to your employee workspace.";
  }

  if (eyebrow.includes("PASSWORD")) {
    return "Enter your email and we’ll help you regain access.";
  }

  return "Set up your profile and join your team workspace.";
};
