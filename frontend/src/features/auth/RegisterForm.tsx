"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  User as UserIcon,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Calendar,
  ShieldCheck,
  ChevronDown,
  ArrowRight,
  AlertCircle,
} from "lucide-react";

import { PhoneField } from "@/components/auth/PhoneField";
import { RegisterFormData, FormErrors } from "@/types/auth";
import {
  normalizeName,
  normalizeFirstName,
  validateRegisterForm,
  validateFirstName,
  validateName,
  validateEmail,
  validatePhoneNumber,
  validateDepartment,
  validateRole,
  validateEmployeeId,
  validateDateOfJoining,
  validatePassword,
} from "@/lib/validation";
import { DEFAULT_COUNTRY_ISO } from "@/lib/countries";
import { api, extractApiError, setAccessToken } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const DEPARTMENTS = [
  "Engineering",
  "Product Management",
  "UI/UX Design",
  "Marketing & Growth",
  "Sales & Business Dev",
  "Operations",
  "Human Resources",
  "Finance & Accounting",
  "Customer Success",
];

const ROLES = [
  "Software Engineer",
  "Senior Developer",
  "Product Manager",
  "Product Designer",
  "Team Lead",
  "Engineering Manager",
  "Operations Specialist",
  "HR Generalist",
  "Marketing Manager",
  "Account Executive",
  "Other",
];

// 18+ Age Requirement: calculate the latest allowed date of birth (18 years ago today)
const getEighteenYearsAgoDate = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 18);
  return d.toISOString().split("T")[0];
};

const MAX_DOB = getEighteenYearsAgoDate();
const MIN_DOB = "1924-01-01";

const initialData: RegisterFormData = {
  firstName: "",
  lastName: "",
  email: "",
  countryCode: DEFAULT_COUNTRY_ISO,
  phoneNumber: "",
  department: "",
  role: "",
  password: "",
  confirmPassword: "",
  employeeId: "",
  dateOfBirth: "",
  agreeToTerms: false,
};

export const RegisterForm = () => {
  const router = useRouter();
  const { setUser } = useAuth();

  const [data, setData] = useState<RegisterFormData>(initialData);
  const [errors, setErrors] = useState<FormErrors<RegisterFormData>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const setField = <K extends keyof RegisterFormData>(
    key: K,
    value: RegisterFormData[K]
  ) => {
    setData((prev) => ({
      ...prev,
      [key]: value,
    }));
    if (errors[key]) {
      setErrors((prev) => ({
        ...prev,
        [key]: undefined,
      }));
    }
  };

  const validateField = (key: keyof RegisterFormData) => {
    let message: string | undefined;

    switch (key) {
      case "firstName":
        message = validateFirstName(data.firstName);
        break;
      case "lastName":
        message = validateName(data.lastName, "Last name");
        break;
      case "email":
        message = validateEmail(data.email);
        break;
      case "phoneNumber":
        message = validatePhoneNumber(data.phoneNumber, data.countryCode);
        break;
      case "department":
        message = validateDepartment(data.department);
        break;
      case "role":
        message = validateRole(data.role);
        break;
      case "employeeId":
        message = validateEmployeeId(data.employeeId);
        break;
      case "dateOfBirth":
        message = validateDateOfBirth(data.dateOfBirth);
        break;
      case "password":
        message = validatePassword(data.password);
        break;
      case "confirmPassword":
        message =
          !data.confirmPassword
            ? "Please confirm your password."
            : data.password !== data.confirmPassword
            ? "Passwords do not match."
            : undefined;
        break;
      default:
        break;
    }

    setErrors((prev) => ({
      ...prev,
      [key]: message,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const validationErrors = validateRegisterForm(data);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await api.post("/auth/register", data);
      const { accessToken, user } = res.data.data;
      setAccessToken(accessToken);
      setUser(user);
      router.push("/dashboard");
    } catch (err) {
      const { message, errors: apiErrors } = extractApiError(err);
      if (apiErrors) {
        setErrors((prev) => ({ ...prev, ...apiErrors }));
      }
      setFormError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      {/* Heading */}
      <div className="text-center mb-6">
        <h2 className="font-serif text-[28px] sm:text-[32px] font-bold text-[#0F172A] tracking-tight">
          Create your account
        </h2>
        <p className="mt-1 text-[13.5px] text-slate-500 font-normal">
          Get started with your team&apos;s task management workspace.
        </p>
      </div>

      {formError && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-[13px] text-red-600 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{formError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* ROW 1: First Name & Last Name */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[13px] font-semibold text-slate-800 mb-1.5">
              First Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                name="firstName"
                value={data.firstName}
                onChange={(e) =>
                  setField("firstName", normalizeFirstName(e.target.value))
                }
                onBlur={() => validateField("firstName")}
                placeholder="Please enter your first name"
                className={`w-full rounded-xl border ${
                  errors.firstName
                    ? "border-red-400 bg-red-50/30"
                    : "border-slate-300 bg-white hover:border-slate-400"
                } py-2.5 pl-10 pr-3.5 text-[13.5px] text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-[#4355CC] focus:ring-2 focus:ring-[#4355CC]/10 focus:outline-none shadow-sm transition-all`}
                maxLength={12}
                autoComplete="given-name"
              />
            </div>
            {errors.firstName && (
              <p className="mt-1 text-[12px] font-medium text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.firstName}
              </p>
            )}
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-slate-800 mb-1.5">
              Last Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                name="lastName"
                value={data.lastName}
                onChange={(e) =>
                  setField("lastName", normalizeName(e.target.value))
                }
                onBlur={() => validateField("lastName")}
                placeholder="Please enter your last name"
                className={`w-full rounded-xl border ${
                  errors.lastName
                    ? "border-red-400 bg-red-50/30"
                    : "border-slate-300 bg-white hover:border-slate-400"
                } py-2.5 pl-10 pr-3.5 text-[13.5px] text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-[#4355CC] focus:ring-2 focus:ring-[#4355CC]/10 focus:outline-none shadow-sm transition-all`}
                maxLength={40}
                autoComplete="family-name"
              />
            </div>
            {errors.lastName && (
              <p className="mt-1 text-[12px] font-medium text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.lastName}
              </p>
            )}
          </div>
        </div>

        {/* ROW 2: Work Email & Phone Number */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[13px] font-semibold text-slate-800 mb-1.5">
              Work Email <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="email"
                name="email"
                value={data.email}
                onChange={(e) => setField("email", e.target.value)}
                onBlur={() => validateField("email")}
                placeholder="you@company.com"
                className={`w-full rounded-xl border ${
                  errors.email
                    ? "border-red-400 bg-red-50/30"
                    : "border-slate-300 bg-white hover:border-slate-400"
                } py-2.5 pl-10 pr-3.5 text-[13.5px] text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-[#4355CC] focus:ring-2 focus:ring-[#4355CC]/10 focus:outline-none shadow-sm transition-all`}
                autoComplete="email"
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-[12px] font-medium text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.email}
              </p>
            )}
          </div>

          <div>
            <PhoneField
              countryIso={data.countryCode}
              phoneNumber={data.phoneNumber}
              onCountryChange={(iso) => setField("countryCode", iso)}
              onPhoneChange={(digits) => setField("phoneNumber", digits)}
              error={errors.phoneNumber}
              required
            />
          </div>
        </div>

        {/* ROW 3: Department & Your Role */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[13px] font-semibold text-slate-800 mb-1.5">
              Department <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                name="department"
                value={data.department}
                onChange={(e) => setField("department", e.target.value)}
                onBlur={() => validateField("department")}
                className={`w-full rounded-xl border ${
                  errors.department
                    ? "border-red-400 bg-red-50/30"
                    : "border-slate-300 bg-white hover:border-slate-400"
                } py-2.5 pl-3.5 pr-10 text-[13.5px] ${
                  data.department ? "text-slate-800" : "text-slate-400"
                } focus:bg-white focus:border-[#4355CC] focus:ring-2 focus:ring-[#4355CC]/10 focus:outline-none shadow-sm transition-all appearance-none cursor-pointer`}
              >
                <option value="" disabled>
                  Select department
                </option>
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept} className="text-slate-800">
                    {dept}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
            {errors.department && (
              <p className="mt-1 text-[12px] font-medium text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.department}
              </p>
            )}
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-slate-800 mb-1.5">
              Your Role <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                name="role"
                value={data.role}
                onChange={(e) => setField("role", e.target.value)}
                onBlur={() => validateField("role")}
                className={`w-full rounded-xl border ${
                  errors.role
                    ? "border-red-400 bg-red-50/30"
                    : "border-slate-300 bg-white hover:border-slate-400"
                } py-2.5 pl-3.5 pr-10 text-[13.5px] ${
                  data.role ? "text-slate-800" : "text-slate-400"
                } focus:bg-white focus:border-[#4355CC] focus:ring-2 focus:ring-[#4355CC]/10 focus:outline-none shadow-sm transition-all appearance-none cursor-pointer`}
              >
                <option value="" disabled>
                  Select your role
                </option>
                {ROLES.map((r) => (
                  <option key={r} value={r} className="text-slate-800">
                    {r}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
            {errors.role && (
              <p className="mt-1 text-[12px] font-medium text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.role}
              </p>
            )}
          </div>
        </div>

        {/* ROW 4: Password & Confirm Password */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[13px] font-semibold text-slate-800 mb-1.5">
              Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={data.password}
                onChange={(e) => setField("password", e.target.value)}
                onBlur={() => validateField("password")}
                placeholder="Create a password"
                className={`w-full rounded-xl border ${
                  errors.password
                    ? "border-red-400 bg-red-50/30"
                    : "border-slate-300 bg-white hover:border-slate-400"
                } py-2.5 pl-10 pr-10 text-[13.5px] text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-[#4355CC] focus:ring-2 focus:ring-[#4355CC]/10 focus:outline-none shadow-sm transition-all`}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-[12px] font-medium text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.password}
              </p>
            )}
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-slate-800 mb-1.5">
              Confirm Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={data.confirmPassword}
                onChange={(e) => setField("confirmPassword", e.target.value)}
                onBlur={() => validateField("confirmPassword")}
                placeholder="Confirm password"
                className={`w-full rounded-xl border ${
                  errors.confirmPassword
                    ? "border-red-400 bg-red-50/30"
                    : "border-slate-300 bg-white hover:border-slate-400"
                } py-2.5 pl-10 pr-10 text-[13.5px] text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-[#4355CC] focus:ring-2 focus:ring-[#4355CC]/10 focus:outline-none shadow-sm transition-all`}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                tabIndex={-1}
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-[12px] font-medium text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.confirmPassword}
              </p>
            )}
          </div>
        </div>

        {/* ROW 5: Employee ID & Date of Birth */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[13px] font-semibold text-slate-800 mb-1.5">
              Employee ID <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                name="employeeId"
                value={data.employeeId}
                onChange={(e) => setField("employeeId", e.target.value)}
                onBlur={() => validateField("employeeId")}
                placeholder="e.g. EMP-1042"
                className={`w-full rounded-xl border ${
                  errors.employeeId
                    ? "border-red-400 bg-red-50/30"
                    : "border-slate-300 bg-white hover:border-slate-400"
                } py-2.5 pl-10 pr-3.5 text-[13.5px] text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-[#4355CC] focus:ring-2 focus:ring-[#4355CC]/10 focus:outline-none shadow-sm transition-all`}
              />
            </div>
            {errors.employeeId && (
              <p className="mt-1 text-[12px] font-medium text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.employeeId}
              </p>
            )}
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-slate-800 mb-1.5">
              Date of Birth <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="date"
                name="dateOfBirth"
                value={data.dateOfBirth}
                max={MAX_DOB}
                min={MIN_DOB}
                onChange={(e) => setField("dateOfBirth", e.target.value)}
                onBlur={() => validateField("dateOfBirth")}
                onClick={(e) => {
                  const input = e.currentTarget as HTMLInputElement;
                  if (typeof input.showPicker === "function") {
                    input.showPicker();
                  }
                }}
                className={`w-full rounded-xl border ${
                  errors.dateOfBirth
                    ? "border-red-400 bg-red-50/30"
                    : "border-slate-300 bg-white hover:border-slate-400"
                } py-2.5 pl-10 pr-3.5 text-[13.5px] text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-[#4355CC] focus:ring-2 focus:ring-[#4355CC]/10 focus:outline-none shadow-sm transition-all cursor-pointer`}
              />
            </div>
            {errors.dateOfBirth ? (
              <p className="mt-1 text-[12px] font-medium text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.dateOfBirth}
              </p>
            ) : (
              <p className="mt-1 text-[11.5px] text-slate-400">
                Must be at least 18 years old (born on or before {MAX_DOB})
              </p>
            )}
          </div>
        </div>

        {/* TERMS & PRIVACY */}
        <div className="pt-1">
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={data.agreeToTerms}
              onChange={(e) => setField("agreeToTerms", e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-[#4355CC] focus:ring-[#4355CC]/20 cursor-pointer"
            />
            <span className="text-[13px] text-slate-600 font-normal">
              I agree to the{" "}
              <Link
                href="/terms"
                className="font-semibold text-[#4355CC] hover:underline"
              >
                Terms of Service
              </Link>{" "}
              &{" "}
              <Link
                href="/privacy"
                className="font-semibold text-[#4355CC] hover:underline"
              >
                Privacy Policy
              </Link>
            </span>
          </label>
          {errors.agreeToTerms && (
            <p className="mt-1 text-[12px] font-medium text-red-500 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.agreeToTerms}
            </p>
          )}
        </div>

        {/* SUBMIT BUTTON */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#4355CC] hover:bg-[#3747B8] active:scale-[0.99] py-3 text-[14.5px] font-medium text-white shadow-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Create Account</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* ALREADY HAVE ACCOUNT */}
        <div className="pt-2 text-center">
          <p className="text-[13.5px] text-slate-600">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-[#4355CC] hover:underline"
            >
              Login
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
};