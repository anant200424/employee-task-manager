"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  Building2,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Briefcase,
  UserCheck,
  Calendar,
  MapPin,
  Users,
  Award,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const ENTERPRISE_ROLES = [
  {
    id: "super_admin",
    label: "Super Administrator",
    subtitle: "Root Platform Authority",
    description: "Supreme organizational control, user governance, security auditing, and top-level workspace administration.",
    badgeClass: "bg-amber-100 text-amber-900 dark:bg-amber-950/70 dark:text-amber-300 border-amber-300 dark:border-amber-700",
  },
  {
    id: "admin",
    label: "Administrator",
    subtitle: "Workspace Operations",
    description: "Manage operational workflows, oversee member status, and configure organizational modules.",
    badgeClass: "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-300 dark:border-purple-800",
  },
  {
    id: "manager",
    label: "Department Manager / Lead",
    subtitle: "Team & Sprint Lead",
    description: "Assign project deliverables, coordinate team members, track milestones, and manage sprint velocity.",
    badgeClass: "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300 dark:border-blue-800",
  },
  {
    id: "employee",
    label: "Staff Contributor",
    subtitle: "Workspace Team Member",
    description: "Execute assigned workspace tasks, report progress, and collaborate across project deliverables.",
    badgeClass: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800",
  },
];

export const EmploymentInfoTab = () => {
  const { user } = useAuth();

  const roleLower = (user?.role || "").toLowerCase();
  const sysRoleLower = (user?.systemRole || "").toLowerCase();

  const isSuperAdmin =
    sysRoleLower === "super_admin" ||
    roleLower.includes("super") ||
    user?.email === "anantsingh20334411@gmail.com";

  const isAdmin =
    isSuperAdmin ||
    roleLower.includes("admin") ||
    ["admin", "system_admin"].includes(sysRoleLower);

  const isManager =
    !isAdmin &&
    sysRoleLower !== "employee" &&
    (sysRoleLower === "manager" || roleLower.includes("manager") || roleLower.includes("lead"));

  const roleDisplayInfo = useMemo(() => {
    if (isSuperAdmin) return ENTERPRISE_ROLES[0];
    if (isAdmin) return ENTERPRISE_ROLES[1];
    if (isManager) return ENTERPRISE_ROLES[2];
    return ENTERPRISE_ROLES[3];
  }, [isSuperAdmin, isAdmin, isManager]);

  const displayDesignation =
    user?.employmentInfo?.designation ||
    (isSuperAdmin
      ? "Super Administrator"
      : isAdmin
      ? "Administrator"
      : user?.role || "Software Engineer");

  const displayEmployeeId = user?.employeeId || "EMP-4098";
  const displayDepartment = user?.department || "Engineering";
  const displayJoiningDate = user?.employmentInfo?.joiningDate
    ? new Date(user.employmentInfo.joiningDate).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "Verified Foundation Date";

  const displayManager =
    user?.employmentInfo?.manager ||
    (isSuperAdmin
      ? "Board of Directors / Executive Oversight"
      : isAdmin
      ? "Super Administrator"
      : "Department Lead");

  const displayLocation = user?.employmentInfo?.workLocation || "HQ Office (San Francisco / Hybrid)";
  const displayEmploymentType = user?.employmentInfo?.employmentType || "Full-Time Corporate";

  return (
    <div className="rounded-[24px] border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-7 sm:p-8 shadow-xs hover:shadow-sm transition-shadow relative overflow-hidden animate-in fade-in duration-300">
      <div className="absolute top-0 left-0 w-full h-1 bg-[#5B5FEF]" />

      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h3 className="text-[20px] font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#5B5FEF]" />
            <span>Employment & Governance Record</span>
          </h3>
          <p className="text-[13.5px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Official organizational profile, system access tier, corporate credentials, and reporting structure.
          </p>
        </div>

        <div className="shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[12px] font-bold shadow-2xs">
          <Lock className="w-3.5 h-3.5 text-slate-500" />
          <span>Immutable Profile Record</span>
        </div>
      </div>

      {/* System Access Privilege Banner */}
      <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-850/80 border border-slate-200/90 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs shrink-0">
            {isSuperAdmin ? (
              <Sparkles className="w-5 h-5 text-amber-500" />
            ) : isAdmin ? (
              <ShieldCheck className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            ) : isManager ? (
              <Briefcase className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            ) : (
              <UserCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[14px] font-black text-slate-900 dark:text-white">
                System Access Privilege:
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[12px] font-extrabold border ${roleDisplayInfo.badgeClass}`}
              >
                {roleDisplayInfo.label}
              </span>
            </div>
            <p className="text-[12.5px] text-slate-500 dark:text-slate-400 mt-1 font-medium max-w-2xl">
              {roleDisplayInfo.description}
            </p>
          </div>
        </div>

        {isSuperAdmin ? (
          <div className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800 text-[11.5px] font-black">
            <Award className="w-3.5 h-3.5 text-amber-600" />
            <span>Root Platform Authority</span>
          </div>
        ) : isAdmin ? (
          <div className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-[11.5px] font-extrabold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Workspace Operations</span>
          </div>
        ) : (
          <div className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[11.5px] font-bold">
            <Lock className="w-3.5 h-3.5" />
            <span>Governed by Super Admin</span>
          </div>
        )}
      </div>

      {/* Structured Enterprise Data Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 mb-6">
        {/* Designation */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800/80 shadow-2xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11.5px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-[#5B5FEF]" /> Designation / Job Title
            </span>
            <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/50 text-[#5B5FEF] border border-indigo-100 dark:border-indigo-900/40">
              Verified Title
            </span>
          </div>
          <p className="text-[16px] font-black text-slate-900 dark:text-white leading-tight mt-1">
            {displayDesignation}
          </p>
          <p className="text-[11.5px] text-slate-400 font-medium mt-1">
            Organizational position designated by company administration.
          </p>
        </div>

        {/* Employee ID */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800/80 shadow-2xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11.5px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-purple-500" /> Corporate Employee ID
            </span>
            <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-100 dark:border-purple-900/40 font-mono">
              Unique Code
            </span>
          </div>
          <p className="text-[16px] font-black text-slate-900 dark:text-white font-mono leading-tight mt-1">
            {displayEmployeeId}
          </p>
          <p className="text-[11.5px] text-slate-400 font-medium mt-1">
            Permanent corporate personnel identifier.
          </p>
        </div>

        {/* Department */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800/80 shadow-2xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11.5px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-blue-500" /> Assigned Department
            </span>
            <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900/40">
              Unit Allocation
            </span>
          </div>
          <p className="text-[16px] font-black text-slate-900 dark:text-white leading-tight mt-1">
            {displayDepartment}
          </p>
          <p className="text-[11.5px] text-slate-400 font-medium mt-1">
            Corporate functional division and resource pool.
          </p>
        </div>

        {/* System Role */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800/80 shadow-2xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11.5px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Platform Governance Tier
            </span>
            <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900/40 uppercase font-mono">
              {user?.systemRole || "employee"}
            </span>
          </div>
          <p className="text-[16px] font-black text-slate-900 dark:text-white leading-tight mt-1">
            {roleDisplayInfo.label}
          </p>
          <p className="text-[11.5px] text-slate-400 font-medium mt-1">
            Role-Based Access Control (RBAC) security permissions.
          </p>
        </div>

        {/* Date of Joining */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800/80 shadow-2xs">
          <span className="text-[11.5px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5 mb-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" /> Date of Joining
          </span>
          <p className="text-[15px] font-bold text-slate-800 dark:text-slate-200 leading-tight mt-1">
            {displayJoiningDate}
          </p>
          <p className="text-[11.5px] text-slate-400 font-medium mt-1">
            Official workspace engagement commencement.
          </p>
        </div>

        {/* Reporting Manager */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800/80 shadow-2xs">
          <span className="text-[11.5px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5 mb-1.5">
            <Users className="w-3.5 h-3.5 text-slate-400" /> Reporting Structure
          </span>
          <p className="text-[15px] font-bold text-slate-800 dark:text-slate-200 leading-tight mt-1">
            {displayManager}
          </p>
          <p className="text-[11.5px] text-slate-400 font-medium mt-1">
            Direct operational reporting and oversight line.
          </p>
        </div>

        {/* Work Location */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800/80 shadow-2xs">
          <span className="text-[11.5px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5 mb-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400" /> Primary Work Modality
          </span>
          <p className="text-[15px] font-bold text-slate-800 dark:text-slate-200 leading-tight mt-1">
            {displayLocation}
          </p>
          <p className="text-[11.5px] text-slate-400 font-medium mt-1">
            Corporate physical location or designated remote arrangement.
          </p>
        </div>

        {/* Employment Type */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800/80 shadow-2xs">
          <span className="text-[11.5px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5 mb-1.5">
            <Award className="w-3.5 h-3.5 text-slate-400" /> Employment Classification
          </span>
          <p className="text-[15px] font-bold text-slate-800 dark:text-slate-200 leading-tight mt-1">
            {displayEmploymentType}
          </p>
          <p className="text-[11.5px] text-slate-400 font-medium mt-1">
            Corporate contract terms and tenure model.
          </p>
        </div>
      </div>

      {/* Enterprise Policy & Governance Notice */}
      <div className="p-5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2 rounded-xl bg-white dark:bg-slate-800 text-[#5B5FEF] shadow-xs shrink-0">
            <ShieldAlert className="w-5 h-5 text-[#5B5FEF]" />
          </div>
          <div>
            <h4 className="text-[13.5px] font-black text-slate-900 dark:text-white">
              Enterprise Governance Lock (Centralized RBAC Control)
            </h4>
            <p className="text-[12.5px] text-slate-600 dark:text-slate-300 mt-1 font-medium leading-relaxed max-w-2xl">
              Organizational designations, employee ID codes, departments, and system privileges cannot be self-modified in personal profile settings. To guarantee audit compliance and prevent unauthorized privilege escalation, all personnel roles are controlled exclusively by the <strong>Super Administrator</strong>.
            </p>
          </div>
        </div>

        {isSuperAdmin && (
          <Link
            href="/employees"
            className="shrink-0 px-4 py-2.5 rounded-xl bg-[#5B5FEF] hover:bg-[#4A4DE0] text-white text-[13px] font-bold shadow-md shadow-[#5B5FEF]/20 hover:shadow-lg transition-all flex items-center gap-2"
          >
            <span>Employee Directory</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        )}
      </div>
    </div>
  );
};
