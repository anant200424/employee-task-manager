"use client";

import { useState, useEffect } from "react";
import {
  X,
  UserPlus,
  User as UserIcon,
  Mail,
  Lock,
  Phone,
  Building2,
  Briefcase,
  Hash,
  MapPin,
  Shield,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "react-hot-toast";
import {
  validateName,
  validateFirstName,
  normalizeFirstName,
  normalizeName,
  validateEmail,
  validatePassword,
  getPasswordStrength,
  validateDepartment,
  validateRole,
  validateEmployeeId,
} from "@/lib/validation";

export const BELOW_ADMIN_DESIGNATIONS: { category: string; roles: string[] }[] = [
  {
    category: "Management & Leads (Below Admin)",
    roles: [
      "Department Manager",
      "Team Lead",
      "Technical Lead",
      "Project Manager",
      "Engineering Manager",
      "Product Manager",
      "Operations Manager",
      "HR Manager",
      "Marketing Manager",
      "Finance Manager",
    ],
  },
  {
    category: "Engineering & Technology",
    roles: [
      "Software Engineer",
      "Senior Software Engineer",
      "Frontend Developer",
      "Backend Developer",
      "Fullstack Engineer",
      "DevOps Engineer",
      "QA Automation Engineer",
      "Data Analyst",
      "Technical Support Associate",
    ],
  },
  {
    category: "Design & Creative",
    roles: [
      "Product Designer",
      "UI/UX Designer",
      "Senior UI/UX Researcher",
      "Visual Designer",
      "Design Lead",
    ],
  },
  {
    category: "Product & Operations",
    roles: [
      "Associate Product Manager",
      "Product Owner",
      "Business Analyst",
      "Operations Coordinator",
      "Project Coordinator",
    ],
  },
  {
    category: "Human Resources & Talent",
    roles: [
      "HR Specialist",
      "HR Coordinator",
      "Talent Acquisition Specialist",
      "People Operations Associate",
    ],
  },
  {
    category: "Marketing & Growth",
    roles: [
      "Marketing Specialist",
      "Content Strategist",
      "Digital Marketing Executive",
      "Growth Associate",
    ],
  },
  {
    category: "Finance & Accounting",
    roles: [
      "Financial Analyst",
      "Staff Accountant",
      "Billing Specialist",
    ],
  },
  {
    category: "General Staff & Contributors",
    roles: [
      "Staff Contributor",
      "Associate",
      "Intern",
    ],
  },
];

interface CreateEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserCreated: () => void;
}

export const CreateEmployeeModal = ({
  isOpen,
  onClose,
  onUserCreated,
}: CreateEmployeeModalProps) => {
  const { user: currentUser } = useAuth();
  const isCallerSuperAdmin =
    currentUser?.systemRole === "super_admin" ||
    String(currentUser?.role || "").toLowerCase().includes("super") ||
    currentUser?.email === "superadmin@empsphere.io";

  const isCallerSystemAdmin =
    currentUser?.systemRole === "system_admin" ||
    String(currentUser?.role || "").toLowerCase().includes("system");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [systemRole, setSystemRole] = useState<"employee" | "manager" | "admin" | "system_admin">("employee");
  const [department, setDepartment] = useState("Engineering");
  const [roleTitle, setRoleTitle] = useState("Software Engineer");
  const [employeeId, setEmployeeId] = useState("");
  const [phone, setPhone] = useState("");
  const [workLocation, setWorkLocation] = useState("HQ Office (San Francisco / Hybrid)");
  const [employmentType, setEmploymentType] = useState("Full-Time Corporate");
  const [saving, setSaving] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formBannerError, setFormBannerError] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleRoleChange = (newRole: "employee" | "manager" | "admin" | "system_admin") => {
    setSystemRole(newRole);
    if (newRole === "system_admin") setRoleTitle("System Administrator");
    else if (newRole === "admin") setRoleTitle("Administrator");
    else if (newRole === "manager") setRoleTitle("Department Manager");
    else setRoleTitle("Software Engineer");
  };

  const validateField = (fieldName: string, value: string): string | undefined => {
    switch (fieldName) {
      case "firstName":
        return validateFirstName(value);
      case "lastName":
        return validateName(value, "Last name");
      case "email":
        return validateEmail(value);
      case "password":
        return validatePassword(value);
      case "department":
        return validateDepartment(value);
      case "roleTitle":
        return validateRole(value);
      case "employeeId":
        return value.trim() ? validateEmployeeId(value) : undefined;
      case "phone":
        if (value.trim()) {
          const cleanPhone = value.trim().replace(/[\s()-]/g, "");
          if (cleanPhone.length < 7 || cleanPhone.length > 15 || !/^\+?[0-9]+$/.test(cleanPhone)) {
            return "Please enter a valid mobile number (7–15 digits, optional +).";
          }
        }
        return undefined;
      default:
        return undefined;
    }
  };

  const handleBlur = (fieldName: string) => {
    let val = "";
    if (fieldName === "firstName") val = firstName;
    else if (fieldName === "lastName") val = lastName;
    else if (fieldName === "email") val = email;
    else if (fieldName === "password") val = password;
    else if (fieldName === "department") val = department;
    else if (fieldName === "roleTitle") val = roleTitle;
    else if (fieldName === "employeeId") val = employeeId;
    else if (fieldName === "phone") val = phone;

    const error = validateField(fieldName, val);
    setFormErrors((prev) => ({
      ...prev,
      [fieldName]: error || "",
    }));
  };

  const validateForm = () => {
    const errs: Record<string, string> = {};

    const fnErr = validateField("firstName", firstName);
    if (fnErr) errs.firstName = fnErr;

    const lnErr = validateField("lastName", lastName);
    if (lnErr) errs.lastName = lnErr;

    const emErr = validateField("email", email);
    if (emErr) errs.email = emErr;

    const pwErr = validateField("password", password);
    if (pwErr) errs.password = pwErr;

    const deptErr = validateField("department", department);
    if (deptErr) errs.department = deptErr;

    const roleErr = validateField("roleTitle", roleTitle);
    if (roleErr) errs.roleTitle = roleErr;

    if (employeeId.trim()) {
      const idErr = validateField("employeeId", employeeId);
      if (idErr) errs.employeeId = idErr;
    }

    if (phone.trim()) {
      const phErr = validateField("phone", phone);
      if (phErr) errs.phone = phErr;
    }

    setFormErrors(errs);
    if (Object.keys(errs).length > 0) {
      setFormBannerError("Please resolve all required fields and validation errors before provisioning.");
      return false;
    }
    setFormBannerError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Please resolve form validation issues before submitting.");
      return;
    }

    try {
      setSaving(true);
      await api.post("/users", {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        password,
        systemRole,
        role: roleTitle.trim(),
        department: department.trim(),
        employeeId: employeeId.trim().toUpperCase() || undefined,
        phoneNumber: phone.trim() || undefined,
        workLocation,
        employmentType,
      });

      toast.success(`Provisioned ${firstName} ${lastName} as [${systemRole}] successfully!`);
      onUserCreated();
      onClose();
    } catch (err: any) {
      console.error("Failed to provision user:", err);
      const errMsg = err.response?.data?.message || "Failed to provision workspace member.";
      setFormBannerError(errMsg);
      toast.error(errMsg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-[24px] max-w-2xl w-full flex flex-col max-h-[92vh] shadow-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 sm:px-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-800/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-[#5B5FEF] flex items-center justify-center font-black shrink-0">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-[16px] font-black text-slate-900 dark:text-white leading-tight">
                Provision Workspace Member
              </h2>
              <p className="text-[11.5px] font-medium text-slate-500 leading-tight mt-0.5">
                Enterprise role assignment, corporate credentials, and departmental allocation
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} noValidate className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="p-4 sm:p-5 space-y-3.5 overflow-y-auto custom-scrollbar flex-1 min-h-0">
          {/* Top Form Error Banner */}
          {formBannerError && (
            <div
              role="alert"
              aria-live="assertive"
              className="rounded-xl border-2 border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 p-3 text-[13px] font-bold text-red-700 dark:text-red-300 flex items-center gap-2 animate-in fade-in duration-150"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400" aria-hidden="true" />
              <span>{formBannerError}</span>
            </div>
          )}

          {/* System Role Selection */}
          <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 space-y-2">
            <label className="block text-[12px] font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-[#5B5FEF]" />
              <span>Platform Access Role (RBAC) <span className="text-red-500 font-black">*</span></span>
            </label>
            <div className={`grid gap-2 ${isCallerSuperAdmin ? "grid-cols-2 sm:grid-cols-4" : isCallerSystemAdmin ? "grid-cols-3" : "grid-cols-2"}`}>
              <button
                type="button"
                onClick={() => handleRoleChange("employee")}
                className={`py-2.5 px-3 rounded-xl text-[12px] font-extrabold border transition-all cursor-pointer text-center ${
                  systemRole === "employee"
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                    : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50"
                }`}
              >
                Staff
              </button>
              <button
                type="button"
                onClick={() => handleRoleChange("manager")}
                className={`py-2.5 px-3 rounded-xl text-[12px] font-extrabold border transition-all cursor-pointer text-center ${
                  systemRole === "manager"
                    ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                    : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50"
                }`}
              >
                Manager
              </button>
              {isCallerSuperAdmin ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleRoleChange("admin")}
                    className={`py-2.5 px-3 rounded-xl text-[12px] font-extrabold border transition-all cursor-pointer text-center ${
                      systemRole === "admin"
                        ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                        : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRoleChange("system_admin")}
                    className={`py-2.5 px-3 rounded-xl text-[12px] font-extrabold border transition-all cursor-pointer text-center ${
                      systemRole === "system_admin"
                        ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                        : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    Sys Admin
                  </button>
                </>
              ) : isCallerSystemAdmin ? (
                <button
                  type="button"
                  onClick={() => handleRoleChange("admin")}
                  className={`py-2.5 px-3 rounded-xl text-[12px] font-extrabold border transition-all cursor-pointer text-center ${
                    systemRole === "admin"
                      ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                      : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50"
                  }`}
                >
                  Admin
                </button>
              ) : null}
            </div>
            {!isCallerSuperAdmin && !isCallerSystemAdmin && (
              <p className="text-[10.5px] font-bold text-slate-400 mt-1">
                Standard Administrators are authorized to provision Staff and Manager accounts.
              </p>
            )}
          </div>

          {/* Names */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-extrabold text-slate-700 dark:text-slate-300 mb-1.5">
                First Name <span className="text-red-500 font-black">*</span>
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => {
                    const norm = normalizeFirstName(e.target.value);
                    setFirstName(norm);
                    if (formErrors.firstName) setFormErrors((prev) => ({ ...prev, firstName: "" }));
                    if (formBannerError) setFormBannerError(null);
                  }}
                  onBlur={() => handleBlur("firstName")}
                  placeholder="e.g. John"
                  aria-required="true"
                  aria-invalid={Boolean(formErrors.firstName)}
                  className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl text-[13px] font-bold text-slate-900 dark:text-white outline-none border-2 transition-all ${
                    formErrors.firstName
                      ? "border-red-400 bg-red-50/30 dark:bg-red-950/20"
                      : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:border-[#4355CC]/50 dark:hover:border-indigo-500/50 focus:bg-white focus:dark:bg-slate-800 focus:border-[#4355CC] dark:focus:border-indigo-500 focus:ring-4 focus:ring-[#4355CC]/15 dark:focus:ring-indigo-500/20"
                  }`}
                />
              </div>
              {formErrors.firstName && (
                <p role="alert" className="mt-1 text-[12px] font-bold text-red-700 dark:text-red-400 flex items-center gap-1 animate-in fade-in duration-150">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>{formErrors.firstName}</span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-[12px] font-extrabold text-slate-700 dark:text-slate-300 mb-1.5">
                Last Name <span className="text-red-500 font-black">*</span>
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => {
                    const norm = normalizeName(e.target.value);
                    setLastName(norm);
                    if (formErrors.lastName) setFormErrors((prev) => ({ ...prev, lastName: "" }));
                    if (formBannerError) setFormBannerError(null);
                  }}
                  onBlur={() => handleBlur("lastName")}
                  placeholder="e.g. Doe"
                  aria-required="true"
                  aria-invalid={Boolean(formErrors.lastName)}
                  className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl text-[13px] font-bold text-slate-900 dark:text-white outline-none border-2 transition-all ${
                    formErrors.lastName
                      ? "border-red-400 bg-red-50/30 dark:bg-red-950/20"
                      : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:border-[#4355CC]/50 dark:hover:border-indigo-500/50 focus:bg-white focus:dark:bg-slate-800 focus:border-[#4355CC] dark:focus:border-indigo-500 focus:ring-4 focus:ring-[#4355CC]/15 dark:focus:ring-indigo-500/20"
                  }`}
                />
              </div>
              {formErrors.lastName && (
                <p role="alert" className="mt-1 text-[12px] font-bold text-red-700 dark:text-red-400 flex items-center gap-1 animate-in fade-in duration-150">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>{formErrors.lastName}</span>
                </p>
              )}
            </div>
          </div>

          {/* Email & Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-extrabold text-slate-700 dark:text-slate-300 mb-1.5">
                Corporate Email <span className="text-red-500 font-black">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (formErrors.email) setFormErrors((prev) => ({ ...prev, email: "" }));
                    if (formBannerError) setFormBannerError(null);
                  }}
                  onBlur={() => handleBlur("email")}
                  placeholder="john.doe@company.com"
                  aria-required="true"
                  aria-invalid={Boolean(formErrors.email)}
                  className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl text-[13px] font-bold text-slate-900 dark:text-white outline-none border-2 transition-all ${
                    formErrors.email
                      ? "border-red-400 bg-red-50/30 dark:bg-red-950/20"
                      : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:border-[#4355CC]/50 dark:hover:border-indigo-500/50 focus:bg-white focus:dark:bg-slate-800 focus:border-[#4355CC] dark:focus:border-indigo-500 focus:ring-4 focus:ring-[#4355CC]/15 dark:focus:ring-indigo-500/20"
                  }`}
                />
              </div>
              {formErrors.email && (
                <p role="alert" className="mt-1 text-[12px] font-bold text-red-700 dark:text-red-400 flex items-center gap-1 animate-in fade-in duration-150">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>{formErrors.email}</span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-[12px] font-extrabold text-slate-700 dark:text-slate-300 mb-1.5">
                Temporary Password <span className="text-red-500 font-black">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (formErrors.password) setFormErrors((prev) => ({ ...prev, password: "" }));
                    if (formBannerError) setFormBannerError(null);
                  }}
                  onBlur={() => handleBlur("password")}
                  placeholder="Min 8 chars, uppercase, number & symbol"
                  aria-required="true"
                  aria-invalid={Boolean(formErrors.password)}
                  className={`w-full pl-10 pr-10 py-2.5 rounded-xl text-[13px] font-bold text-slate-900 dark:text-white outline-none border-2 transition-all ${
                    formErrors.password
                      ? "border-red-400 bg-red-50/30 dark:bg-red-950/20"
                      : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:border-[#4355CC]/50 dark:hover:border-indigo-500/50 focus:bg-white focus:dark:bg-slate-800 focus:border-[#4355CC] dark:focus:border-indigo-500 focus:ring-4 focus:ring-[#4355CC]/15 dark:focus:ring-indigo-500/20"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {formErrors.password && (
                <p role="alert" className="mt-1 text-[12px] font-bold text-red-700 dark:text-red-400 flex items-center gap-1 animate-in fade-in duration-150">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>{formErrors.password}</span>
                </p>
              )}

              {/* Real-time Enterprise Password Security Meter */}
              {password.length > 0 && (() => {
                const strength = getPasswordStrength(password);
                const scoreColors = [
                  "bg-red-500",
                  "bg-rose-500",
                  "bg-amber-500",
                  "bg-blue-500",
                  "bg-emerald-500",
                ];
                const scoreTextColor = [
                  "text-red-600 dark:text-red-400",
                  "text-rose-600 dark:text-rose-400",
                  "text-amber-600 dark:text-amber-400",
                  "text-blue-600 dark:text-blue-400",
                  "text-emerald-600 dark:text-emerald-400",
                ];

                return (
                  <div className="mt-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-1.5 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                        <Shield className="w-3 h-3 text-slate-500" /> Password Strength:
                      </span>
                      <span className={`font-black uppercase tracking-wider ${scoreTextColor[strength.score]}`}>
                        {strength.label}
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-1 h-1.5">
                      {[0, 1, 2, 3].map((step) => (
                        <div
                          key={step}
                          className={`h-full rounded-full transition-all duration-300 ${
                            strength.score >= step + 1
                              ? scoreColors[strength.score]
                              : "bg-slate-200 dark:bg-slate-700"
                          }`}
                        />
                      ))}
                    </div>

                    <div className="pt-0.5 flex flex-wrap gap-1">
                      {[
                        { label: "8+ chars", met: strength.checks.length },
                        { label: "A-Z", met: strength.checks.uppercase },
                        { label: "a-z", met: strength.checks.lowercase },
                        { label: "0-9", met: strength.checks.number },
                        { label: "Symbol", met: strength.checks.special },
                      ].map((crit, idx) => (
                        <span
                          key={idx}
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border transition-all ${
                            crit.met
                              ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/80"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700"
                          }`}
                        >
                          {crit.met ? "✓" : "•"} {crit.label}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Department & Role Title */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-extrabold text-slate-700 dark:text-slate-300 mb-1.5">
                Department <span className="text-red-500 font-black">*</span>
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={department}
                  onChange={(e) => {
                    const newDept = e.target.value;
                    setDepartment(newDept);
                    const defaultRoles: Record<string, string> = {
                      Engineering: "Software Engineer",
                      Design: "UI/UX Designer",
                      Product: "Product Manager",
                      "Human Resources": "HR Specialist",
                      Marketing: "Marketing Specialist",
                      Finance: "Financial Analyst",
                      Operations: "Operations Coordinator",
                    };
                    if (defaultRoles[newDept]) {
                      setRoleTitle(defaultRoles[newDept]);
                      if (formErrors.roleTitle) setFormErrors((prev) => ({ ...prev, roleTitle: "" }));
                    }
                    if (formErrors.department) setFormErrors((prev) => ({ ...prev, department: "" }));
                    if (formBannerError) setFormBannerError(null);
                  }}
                  onBlur={() => handleBlur("department")}
                  aria-required="true"
                  aria-invalid={Boolean(formErrors.department)}
                  className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl text-[13px] font-bold text-slate-900 dark:text-white outline-none border-2 transition-all cursor-pointer ${
                    formErrors.department
                      ? "border-red-400 bg-red-50/30 dark:bg-red-950/20"
                      : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:border-[#4355CC]/50 dark:hover:border-indigo-500/50 focus:bg-white focus:dark:bg-slate-800 focus:border-[#4355CC] dark:focus:border-indigo-500 focus:ring-4 focus:ring-[#4355CC]/15 dark:focus:ring-indigo-500/20"
                  }`}
                >
                  <option value="Engineering">Engineering</option>
                  <option value="Design">Design</option>
                  <option value="Product">Product</option>
                  <option value="Human Resources">Human Resources</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Finance">Finance</option>
                  <option value="Operations">Operations</option>
                </select>
              </div>
              {formErrors.department && (
                <p role="alert" className="mt-1 text-[12px] font-bold text-red-700 dark:text-red-400 flex items-center gap-1 animate-in fade-in duration-150">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>{formErrors.department}</span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-[12px] font-extrabold text-slate-700 dark:text-slate-300 mb-1.5">
                Designation / Job Title <span className="text-red-500 font-black">*</span>
              </label>
              <div className="relative">
                <Briefcase className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={roleTitle}
                  onChange={(e) => {
                    setRoleTitle(e.target.value);
                    if (formErrors.roleTitle) setFormErrors((prev) => ({ ...prev, roleTitle: "" }));
                    if (formBannerError) setFormBannerError(null);
                  }}
                  onBlur={() => handleBlur("roleTitle")}
                  aria-required="true"
                  aria-invalid={Boolean(formErrors.roleTitle)}
                  className={`w-full pl-10 pr-8 py-2.5 rounded-xl text-[13px] font-bold text-slate-900 dark:text-white outline-none border-2 transition-all cursor-pointer ${
                    formErrors.roleTitle
                      ? "border-red-400 bg-red-50/30 dark:bg-red-950/20"
                      : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:border-[#4355CC]/50 dark:hover:border-indigo-500/50 focus:bg-white focus:dark:bg-slate-800 focus:border-[#4355CC] dark:focus:border-indigo-500 focus:ring-4 focus:ring-[#4355CC]/15 dark:focus:ring-indigo-500/20"
                  }`}
                >
                  <option value="" disabled>Select Designation (Below Admin)...</option>
                  {BELOW_ADMIN_DESIGNATIONS.map((group) => (
                    <optgroup key={group.category} label={group.category}>
                      {group.roles.map((title) => (
                        <option key={title} value={title}>
                          {title}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
              {formErrors.roleTitle && (
                <p role="alert" className="mt-1 text-[12px] font-bold text-red-700 dark:text-red-400 flex items-center gap-1 animate-in fade-in duration-150">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>{formErrors.roleTitle}</span>
                </p>
              )}
            </div>
          </div>

          {/* Employee ID & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-extrabold text-slate-700 dark:text-slate-300 mb-1.5">
                Corporate Employee ID <span className="text-slate-400 font-normal">(Auto-generated if empty)</span>
              </label>
              <div className="relative">
                <Hash className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={employeeId}
                  onChange={(e) => {
                    const norm = e.target.value.toUpperCase().replace(/\s+/g, "");
                    setEmployeeId(norm);
                    if (formErrors.employeeId) setFormErrors((prev) => ({ ...prev, employeeId: "" }));
                    if (formBannerError) setFormBannerError(null);
                  }}
                  onBlur={() => handleBlur("employeeId")}
                  placeholder="e.g. EMP-5091"
                  aria-invalid={Boolean(formErrors.employeeId)}
                  className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl text-[13px] font-bold text-slate-900 dark:text-white outline-none border-2 transition-all uppercase font-mono ${
                    formErrors.employeeId
                      ? "border-red-400 bg-red-50/30 dark:bg-red-950/20"
                      : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:border-[#4355CC]/50 dark:hover:border-indigo-500/50 focus:bg-white focus:dark:bg-slate-800 focus:border-[#4355CC] dark:focus:border-indigo-500 focus:ring-4 focus:ring-[#4355CC]/15 dark:focus:ring-indigo-500/20"
                  }`}
                />
              </div>
              {formErrors.employeeId && (
                <p role="alert" className="mt-1 text-[12px] font-bold text-red-700 dark:text-red-400 flex items-center gap-1 animate-in fade-in duration-150">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>{formErrors.employeeId}</span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-[12px] font-extrabold text-slate-700 dark:text-slate-300 mb-1.5">
                Phone Number <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (formErrors.phone) setFormErrors((prev) => ({ ...prev, phone: "" }));
                    if (formBannerError) setFormBannerError(null);
                  }}
                  onBlur={() => handleBlur("phone")}
                  placeholder="+1 234 567 8900"
                  aria-invalid={Boolean(formErrors.phone)}
                  className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl text-[13px] font-bold text-slate-900 dark:text-white outline-none border-2 transition-all ${
                    formErrors.phone
                      ? "border-red-400 bg-red-50/30 dark:bg-red-950/20"
                      : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:border-[#4355CC]/50 dark:hover:border-indigo-500/50 focus:bg-white focus:dark:bg-slate-800 focus:border-[#4355CC] dark:focus:border-indigo-500 focus:ring-4 focus:ring-[#4355CC]/15 dark:focus:ring-indigo-500/20"
                  }`}
                />
              </div>
              {formErrors.phone && (
                <p role="alert" className="mt-1 text-[12px] font-bold text-red-700 dark:text-red-400 flex items-center gap-1 animate-in fade-in duration-150">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>{formErrors.phone}</span>
                </p>
              )}
            </div>
          </div>

          {/* Modality & Employment Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-extrabold text-slate-700 dark:text-slate-300 mb-1.5">
                Work Modality
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <select
                  value={workLocation}
                  onChange={(e) => setWorkLocation(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl text-[13px] font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:border-[#5B5FEF] outline-none cursor-pointer"
                >
                  <option value="HQ Office (San Francisco / Hybrid)">HQ Office (Hybrid)</option>
                  <option value="Full Remote (Global)">Full Remote (Global)</option>
                  <option value="On-Site Corporate">On-Site Corporate</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-extrabold text-slate-700 dark:text-slate-300 mb-1.5">
                Employment Classification
              </label>
              <div className="relative">
                <Briefcase className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <select
                  value={employmentType}
                  onChange={(e) => setEmploymentType(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl text-[13px] font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:border-[#5B5FEF] outline-none cursor-pointer"
                >
                  <option value="Full-Time Corporate">Full-Time Corporate</option>
                  <option value="Contractor / Consultant">Contractor / Consultant</option>
                  <option value="Part-Time Staff">Part-Time Staff</option>
                  <option value="Internship Fellowship">Internship Fellowship</option>
                </select>
              </div>
            </div>
            </div>
          </div>

          {/* Action Buttons Pinned Footer */}
          <div className="px-5 py-3 sm:px-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40 shrink-0">
            <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
              Press <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-mono">Esc</kbd> to exit
            </span>
            <div className="flex items-center gap-2.5 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-[12.5px] font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-xl bg-[#5B5FEF] hover:bg-[#4d51db] text-white text-[12.5px] font-extrabold shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                <span>{saving ? "Provisioning..." : "Provision Member"}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
