"use client";

import { useState, useEffect } from "react";
import {
  X,
  Edit2,
  User as UserIcon,
  Mail,
  Phone,
  Building2,
  Briefcase,
  Hash,
  Loader2,
  Save,
  AlertCircle,
  Shield,
  Lock,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { isSuperAdminUser, isSystemAdminUser, isAdminUser } from "@/lib/roleUtils";
import { toast } from "react-hot-toast";
import {
  validateName,
  validateFirstName,
  normalizeFirstName,
  normalizeName,
  validateEmail,
  validateDepartment,
  validateRole,
  validateEmployeeId,
} from "@/lib/validation";
import { BELOW_ADMIN_DESIGNATIONS } from "./CreateEmployeeModal";

interface UserItem {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  role: string;
  systemRole?: string;
  department: string;
  employeeId: string;
  email: string;
  phone: string;
  status: string;
  isBlocked: boolean;
  blockedAt?: string;
  blockedReason?: string;
  avatarUrl?: string;
}

interface EditEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserItem | null;
  onUserUpdated: () => void;
}

export const EditEmployeeModal = ({
  isOpen,
  onClose,
  user,
  onUserUpdated,
}: EditEmployeeModalProps) => {
  const { user: currentUser } = useAuth();
  const isCallerSuperAdmin = isSuperAdminUser(currentUser);
  const isCallerSystemAdmin = isSystemAdminUser(currentUser);
  const isCallerAdmin = isAdminUser(currentUser);

  const isSelf = Boolean(
    user &&
      currentUser &&
      (((currentUser as any)?._id && user.id === (currentUser as any)._id) ||
        ((currentUser as any)?.id && user.id === (currentUser as any).id) ||
        (currentUser.email && user.email && currentUser.email.toLowerCase().trim() === user.email.toLowerCase().trim()))
  );

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [role, setRole] = useState("");
  const [systemRole, setSystemRole] = useState("employee");
  const [employeeId, setEmployeeId] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formBannerError, setFormBannerError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || "");
      setLastName(user.lastName || "");
      setEmail(user.email || "");
      setDepartment(user.department || "Engineering");
      setRole(user.role || "Software Engineer");
      setSystemRole(
        user.systemRole ||
          (user.role?.toLowerCase().includes("admin")
            ? "admin"
            : user.role?.toLowerCase().includes("manager")
            ? "manager"
            : "employee")
      );
      setEmployeeId(user.employeeId || "EMP-1042");
      setPhone(user.phone === "No phone" ? "" : user.phone || "");
      setFormErrors({});
      setFormBannerError(null);
    }
  }, [user, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !user) return null;

  const validateField = (fieldName: string, value: string): string | undefined => {
    switch (fieldName) {
      case "firstName":
        return validateFirstName(value);
      case "lastName":
        return validateName(value, "Last name");
      case "email":
        return validateEmail(value);
      case "department":
        return validateDepartment(value);
      case "role":
        return validateRole(value);
      case "employeeId":
        return validateEmployeeId(value);
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
    else if (fieldName === "department") val = department;
    else if (fieldName === "role") val = role;
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

    const deptErr = validateField("department", department);
    if (deptErr) errs.department = deptErr;

    const roleErr = validateField("role", role);
    if (roleErr) errs.role = roleErr;

    const idErr = validateField("employeeId", employeeId);
    if (idErr) errs.employeeId = idErr;

    if (phone.trim()) {
      const phErr = validateField("phone", phone);
      if (phErr) errs.phone = phErr;
    }

    setFormErrors(errs);
    if (Object.keys(errs).length > 0) {
      setFormBannerError("Please resolve all required fields and validation errors before saving.");
      return false;
    }
    setFormBannerError(null);
    return true;
  };

  const getStaffDesignationForDepartment = (dept: string) => {
    const d = (dept || "").toLowerCase();
    if (d.includes("eng")) return "Software Engineer";
    if (d.includes("des")) return "UI/UX Designer";
    if (d.includes("prod")) return "Business Analyst";
    if (d.includes("hr") || d.includes("human")) return "HR Specialist";
    if (d.includes("mark")) return "Marketing Specialist";
    if (d.includes("fin")) return "Financial Analyst";
    if (d.includes("oper")) return "Operations Coordinator";
    return "Software Engineer";
  };

  const getManagerDesignationForDepartment = (dept: string) => {
    const d = (dept || "").toLowerCase();
    if (d.includes("eng")) return "Engineering Manager";
    if (d.includes("des")) return "Design Lead";
    if (d.includes("prod")) return "Product Manager";
    if (d.includes("hr") || d.includes("human")) return "HR Manager";
    if (d.includes("mark")) return "Marketing Manager";
    if (d.includes("fin")) return "Finance Manager";
    if (d.includes("oper")) return "Operations Manager";
    return "Department Manager";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      const updatePayload: Record<string, any> = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        phoneNumber: phone.trim(),
      };

      if (isCallerAdmin) {
        updatePayload.department = department.trim();
        let finalRole = role.trim();
        // If demoting to employee, ensure role title transitions to a staff designation
        if (
          systemRole === "employee" &&
          (finalRole.toLowerCase().includes("manager") ||
            finalRole.toLowerCase().includes("lead") ||
            finalRole.toLowerCase().includes("admin"))
        ) {
          finalRole = getStaffDesignationForDepartment(department);
        }
        updatePayload.role = finalRole;
        if (!isSelf || isCallerSuperAdmin) {
          updatePayload.systemRole = systemRole;
        }
      }

      if (isCallerSuperAdmin) {
        updatePayload.employeeId = employeeId.trim().toUpperCase();
      }

      await api.patch(`/users/${user.id}`, updatePayload);
      toast.success("Employee profile updated successfully!");
      onUserUpdated();
      onClose();
    } catch (err: any) {
      console.error("Failed to update employee:", err);
      const msg = err.response?.data?.message || "Failed to update employee.";
      setFormBannerError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleSystemRoleChange = (newSysRole: string) => {
    if (!isCallerAdmin) return;
    setSystemRole(newSysRole);
    const curRoleLower = (role || "").toLowerCase();
    if (newSysRole === "manager" && (!role || role === "Software Engineer" || curRoleLower === "employee" || !curRoleLower.includes("manager"))) {
      setRole(getManagerDesignationForDepartment(department));
    } else if (newSysRole === "admin" && (!role || role === "Software Engineer" || curRoleLower === "employee")) {
      setRole("Administrator");
    } else if (newSysRole === "system_admin" && (!role || role === "Software Engineer" || curRoleLower === "employee")) {
      setRole("System Administrator");
    } else if (newSysRole === "super_admin") {
      setRole("Super Administrator");
    } else if (
      newSysRole === "employee" &&
      (curRoleLower.includes("manager") ||
        curRoleLower.includes("lead") ||
        curRoleLower.includes("admin") ||
        role === "Department Manager" ||
        role === "Administrator")
    ) {
      setRole(getStaffDesignationForDepartment(department));
    }
    if (formErrors.role) setFormErrors((prev) => ({ ...prev, role: "" }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-[24px] max-w-2xl w-full flex flex-col max-h-[92vh] shadow-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 py-3.5 sm:px-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-800/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-[#5B5FEF] flex items-center justify-center font-black shrink-0">
              <Edit2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-[16px] font-black text-slate-900 dark:text-white leading-tight">
                Edit Employee Profile
              </h2>
              <p className="text-[11.5px] font-medium text-slate-500 leading-tight mt-0.5">
                Update credentials, department, and role assignments
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

        {/* Form Container */}
        <form onSubmit={handleSubmit} noValidate className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Form Body (Compact layout so standard screens don't require scrolling, with scroll fallback) */}
          <div className="p-4 sm:p-5 space-y-3 overflow-y-auto custom-scrollbar flex-1 min-h-0">
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

            {/* Avatar Preview & Name Info Strip */}
            <div className="flex items-center justify-between p-2.5 sm:px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-slate-900 text-white font-black flex items-center justify-center text-xs overflow-hidden shrink-0 shadow-xs ring-2 ring-indigo-500/20">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase() || "EM"
                  )}
                </div>
                <div className="min-w-0">
                  <h4 className="text-[13.5px] font-black text-slate-900 dark:text-white truncate leading-tight">
                    {firstName || "Employee"} {lastName}
                  </h4>
                  <p className="text-[11.5px] font-mono text-[#5B5FEF] font-bold leading-tight mt-0.5">
                    {employeeId}
                  </p>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-[#5B5FEF] border border-indigo-100 dark:border-indigo-900/40">
                  {department || "Engineering"}
                </span>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 capitalize">
                  {systemRole.replace("_", " ")}
                </span>
              </div>
            </div>

            {/* Enterprise Governance Notice */}
            {isSelf && !isCallerSuperAdmin && (
              <div className="py-2 px-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-[11.5px] font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Self-Governance Lock: You cannot modify your own system role or permissions.</span>
              </div>
            )}
            {!isCallerAdmin && (
              <div className="py-2 px-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-[11.5px] font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Enterprise Governance Lock: You do not have permission to modify employee roles and departments.</span>
              </div>
            )}
            {isCallerSystemAdmin && !isCallerSuperAdmin && (
              <div className="py-2 px-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 text-[11.5px] font-semibold text-indigo-800 dark:text-indigo-300 flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#5B5FEF] shrink-0" />
                <span className="leading-tight">
                  <strong className="font-extrabold">System Administrator Scope:</strong> You have delegated authority to manage Admin, Manager, and Employee roles. Super Administrator accounts are root-governed.
                </span>
              </div>
            )}
            {!isCallerSuperAdmin && !isCallerSystemAdmin && isCallerAdmin && (
              <div className="py-2 px-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 text-[11.5px] font-semibold text-indigo-800 dark:text-indigo-300 flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#5B5FEF] shrink-0" />
                <span className="leading-tight">
                  <strong className="font-extrabold">Administrator Scope:</strong> You can assign roles below Administrator (Employee or Manager). Only Super Administrator can grant administrative privileges.
                </span>
              </div>
            )}

            {/* First & Last Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11.5px] font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                  First Name <span className="text-red-500 font-black">*</span>
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
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
                    placeholder="First name"
                    aria-required="true"
                    aria-invalid={Boolean(formErrors.firstName)}
                    className={`w-full pl-9 pr-3 py-2 rounded-xl text-[12.5px] font-bold text-slate-900 dark:text-white outline-none border-2 transition-all ${
                      formErrors.firstName
                        ? "border-red-400 bg-red-50/30 dark:bg-red-950/20"
                        : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:border-[#4355CC]/50 dark:hover:border-indigo-500/50 focus:bg-white focus:dark:bg-slate-800 focus:border-[#4355CC] dark:focus:border-indigo-500 focus:ring-4 focus:ring-[#4355CC]/15 dark:focus:ring-indigo-500/20"
                    }`}
                  />
                </div>
                {formErrors.firstName && (
                  <p role="alert" className="text-[11px] font-bold text-red-500 dark:text-red-400 flex items-center gap-1 mt-1 animate-in fade-in duration-150">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>{formErrors.firstName}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[11.5px] font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                  Last Name <span className="text-red-500 font-black">*</span>
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
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
                    placeholder="Last name"
                    aria-required="true"
                    aria-invalid={Boolean(formErrors.lastName)}
                    className={`w-full pl-9 pr-3 py-2 rounded-xl text-[12.5px] font-bold text-slate-900 dark:text-white outline-none border-2 transition-all ${
                      formErrors.lastName
                        ? "border-red-400 bg-red-50/30 dark:bg-red-950/20"
                        : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:border-[#4355CC]/50 dark:hover:border-indigo-500/50 focus:bg-white focus:dark:bg-slate-800 focus:border-[#4355CC] dark:focus:border-indigo-500 focus:ring-4 focus:ring-[#4355CC]/15 dark:focus:ring-indigo-500/20"
                    }`}
                  />
                </div>
                {formErrors.lastName && (
                  <p role="alert" className="text-[11px] font-bold text-red-500 dark:text-red-400 flex items-center gap-1 mt-1 animate-in fade-in duration-150">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>{formErrors.lastName}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Email & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11.5px] font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address <span className="text-red-500 font-black">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (formErrors.email) setFormErrors((prev) => ({ ...prev, email: "" }));
                      if (formBannerError) setFormBannerError(null);
                    }}
                    onBlur={() => handleBlur("email")}
                    placeholder="employee@company.com"
                    aria-required="true"
                    aria-invalid={Boolean(formErrors.email)}
                    className={`w-full pl-9 pr-3 py-2 rounded-xl text-[12.5px] font-bold text-slate-900 dark:text-white outline-none border-2 transition-all ${
                      formErrors.email
                        ? "border-red-400 bg-red-50/30 dark:bg-red-950/20"
                        : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:border-[#4355CC]/50 dark:hover:border-indigo-500/50 focus:bg-white focus:dark:bg-slate-800 focus:border-[#4355CC] dark:focus:border-indigo-500 focus:ring-4 focus:ring-[#4355CC]/15 dark:focus:ring-indigo-500/20"
                    }`}
                  />
                </div>
                {formErrors.email && (
                  <p role="alert" className="text-[11px] font-bold text-red-500 dark:text-red-400 flex items-center gap-1 mt-1 animate-in fade-in duration-150">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>{formErrors.email}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[11.5px] font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
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
                    className={`w-full pl-9 pr-3 py-2 rounded-xl text-[12.5px] font-bold text-slate-900 dark:text-white outline-none border-2 transition-all ${
                      formErrors.phone
                        ? "border-red-400 bg-red-50/30 dark:bg-red-950/20"
                        : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:border-[#4355CC]/50 dark:hover:border-indigo-500/50 focus:bg-white focus:dark:bg-slate-800 focus:border-[#4355CC] dark:focus:border-indigo-500 focus:ring-4 focus:ring-[#4355CC]/15 dark:focus:ring-indigo-500/20"
                    }`}
                  />
                </div>
                {formErrors.phone && (
                  <p role="alert" className="text-[11px] font-bold text-red-500 dark:text-red-400 flex items-center gap-1 mt-1 animate-in fade-in duration-150">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>{formErrors.phone}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Department & Role */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11.5px] font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                  Department <span className="text-red-500 font-black">*</span>
                  {!isCallerAdmin && <span className="text-amber-600 text-[10.5px] font-semibold ml-1">(Admin Only)</span>}
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    disabled={!isCallerAdmin}
                    value={department}
                    onChange={(e) => {
                      if (!isCallerAdmin) return;
                      setDepartment(e.target.value);
                      if (formErrors.department) setFormErrors((prev) => ({ ...prev, department: "" }));
                      if (formBannerError) setFormBannerError(null);
                    }}
                    onBlur={() => handleBlur("department")}
                    aria-required="true"
                    aria-invalid={Boolean(formErrors.department)}
                    className={`w-full pl-9 pr-3 py-2 rounded-xl text-[12.5px] font-bold text-slate-900 dark:text-white outline-none border-2 transition-all ${
                      !isCallerAdmin
                        ? "bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-500 cursor-not-allowed"
                        : formErrors.department
                        ? "border-red-400 bg-red-50/30 dark:bg-red-950/20 cursor-pointer"
                        : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:border-[#4355CC]/50 dark:hover:border-indigo-500/50 focus:bg-white focus:dark:bg-slate-800 focus:border-[#4355CC] dark:focus:border-indigo-500 focus:ring-4 focus:ring-[#4355CC]/15 dark:focus:ring-indigo-500/20 cursor-pointer"
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
                  <p role="alert" className="text-[11px] font-bold text-red-500 dark:text-red-400 flex items-center gap-1 mt-1 animate-in fade-in duration-150">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>{formErrors.department}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[11.5px] font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                  Role / Job Title <span className="text-red-500 font-black">*</span>
                  {!isCallerAdmin && <span className="text-amber-600 text-[10.5px] font-semibold ml-1">(Admin Only)</span>}
                </label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    disabled={!isCallerAdmin}
                    value={role}
                    onChange={(e) => {
                      if (!isCallerAdmin) return;
                      setRole(e.target.value);
                      if (formErrors.role) setFormErrors((prev) => ({ ...prev, role: "" }));
                      if (formBannerError) setFormBannerError(null);
                    }}
                    onBlur={() => handleBlur("role")}
                    aria-required="true"
                    aria-invalid={Boolean(formErrors.role)}
                    className={`w-full pl-9 pr-8 py-2 rounded-xl text-[12.5px] font-bold text-slate-900 dark:text-white outline-none border-2 transition-all cursor-pointer ${
                      !isCallerAdmin
                        ? "bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-500 cursor-not-allowed"
                        : formErrors.role
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
                    {role && !BELOW_ADMIN_DESIGNATIONS.some((g) => g.roles.includes(role)) && (
                      <option value={role}>{role}</option>
                    )}
                  </select>
                </div>
                {formErrors.role && (
                  <p role="alert" className="text-[11px] font-bold text-red-500 dark:text-red-400 flex items-center gap-1 mt-1 animate-in fade-in duration-150">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>{formErrors.role}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Employee ID & System Role (RBAC) Side-by-Side */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
              {/* Employee ID Code */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11.5px] font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <span>Employee ID Code</span>
                    <span className="text-red-500 font-black">*</span>
                  </label>
                  {!isCallerSuperAdmin && (
                    <span className="text-amber-600 dark:text-amber-400 text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-200/60 dark:border-amber-900/40">
                      Super Admin Only
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    readOnly={!isCallerSuperAdmin}
                    value={employeeId}
                    onChange={(e) => {
                      if (!isCallerSuperAdmin) return;
                      const norm = e.target.value.toUpperCase().replace(/\s+/g, "");
                      setEmployeeId(norm);
                      if (formErrors.employeeId) setFormErrors((prev) => ({ ...prev, employeeId: "" }));
                      if (formBannerError) setFormBannerError(null);
                    }}
                    onBlur={() => handleBlur("employeeId")}
                    placeholder="e.g. EMP-1042"
                    aria-invalid={Boolean(formErrors.employeeId)}
                    className={`w-full pl-9 pr-3 py-2 rounded-xl text-[12.5px] font-bold font-mono text-slate-900 dark:text-white outline-none border-2 transition-all ${
                      !isCallerSuperAdmin
                        ? "bg-slate-100/80 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-500 cursor-not-allowed"
                        : formErrors.employeeId
                        ? "border-red-400 bg-red-50/30 dark:bg-red-950/20"
                        : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:border-[#4355CC]/50 dark:hover:border-indigo-500/50 focus:bg-white focus:dark:bg-slate-800 focus:border-[#4355CC] dark:focus:border-indigo-500 focus:ring-4 focus:ring-[#4355CC]/15 dark:focus:ring-indigo-500/20"
                    }`}
                  />
                </div>
                {formErrors.employeeId && (
                  <p role="alert" className="text-[11px] font-bold text-red-500 dark:text-red-400 flex items-center gap-1 mt-1 animate-in fade-in duration-150">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>{formErrors.employeeId}</span>
                  </p>
                )}
              </div>

              {/* System Role (RBAC) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11.5px] font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5 text-[#5B5FEF]" />
                    <span>System Role (RBAC)</span>
                    {!isCallerAdmin && <span className="text-amber-600 text-[10.5px] font-semibold ml-1">(Admin Only)</span>}
                  </label>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 capitalize">
                    {systemRole.replace("_", " ")}
                  </span>
                </div>

                {isSelf && !isCallerSuperAdmin ? (
                  <div className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-500 text-[11.5px] font-bold">
                    Self-role modification locked by enterprise governance.
                  </div>
                ) : isCallerSuperAdmin ? (
                  <div className="relative">
                    <Shield className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <select
                      value={systemRole}
                      onChange={(e) => handleSystemRoleChange(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2 rounded-xl text-[12.5px] font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:border-[#5B5FEF] outline-none cursor-pointer"
                    >
                      <option value="employee">Employee (Staff Contributor)</option>
                      <option value="manager">Manager (Team Lead & Task Assignee)</option>
                      <option value="admin">Administrator (Operations Controller)</option>
                      <option value="system_admin">System Admin (Security & Auditing)</option>
                      <option value="super_admin">Super Administrator (Root Governance)</option>
                    </select>
                  </div>
                ) : isCallerSystemAdmin ? (
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: "employee", label: "Employee", desc: "Staff Contributor" },
                      { id: "manager", label: "Manager", desc: "Team Lead" },
                      { id: "admin", label: "Admin", desc: "Operations" },
                    ].map((sRole) => (
                      <button
                        key={sRole.id}
                        type="button"
                        onClick={() => handleSystemRoleChange(sRole.id)}
                        className={`py-1.5 px-2 rounded-xl border text-left transition-all ${
                          systemRole === sRole.id
                            ? "bg-[#5B5FEF] text-white border-[#5B5FEF] shadow-xs cursor-pointer"
                            : "bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-[#5B5FEF]/50 cursor-pointer"
                        }`}
                      >
                        <p className="text-[11.5px] font-black leading-tight">{sRole.label}</p>
                        <p
                          className={`text-[9px] mt-0.5 leading-tight ${
                            systemRole === sRole.id ? "text-indigo-100" : "text-slate-400 dark:text-slate-500"
                          }`}
                        >
                          {sRole.desc}
                        </p>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { id: "employee", label: "Employee", desc: "Staff Contributor" },
                      { id: "manager", label: "Manager", desc: "Team Lead" },
                    ].map((sRole) => (
                      <button
                        key={sRole.id}
                        type="button"
                        disabled={!isCallerAdmin}
                        onClick={() => handleSystemRoleChange(sRole.id)}
                        className={`py-1.5 px-2.5 rounded-xl border text-left transition-all ${
                          !isCallerAdmin
                            ? "opacity-50 cursor-not-allowed bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700"
                            : systemRole === sRole.id
                            ? "bg-[#5B5FEF] text-white border-[#5B5FEF] shadow-xs cursor-pointer"
                            : "bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-[#5B5FEF]/50 cursor-pointer"
                        }`}
                      >
                        <p className="text-[11.5px] font-black leading-tight">{sRole.label}</p>
                        <p
                          className={`text-[9.5px] mt-0.5 leading-tight ${
                            systemRole === sRole.id ? "text-indigo-100" : "text-slate-400 dark:text-slate-500"
                          }`}
                        >
                          {sRole.desc}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Pinned Footer - ALWAYS visible, never cut off! */}
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
                className="px-5 py-2 rounded-xl bg-[#5B5FEF] hover:bg-[#4d51db] text-white text-[12.5px] font-extrabold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
