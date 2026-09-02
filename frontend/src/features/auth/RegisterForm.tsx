"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  User as UserIcon,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Calendar,
  ShieldCheck,
  ChevronDown,
  ArrowRight,
  AlertCircle,
  Camera,
  Upload,
  X,
  Eraser,
} from "lucide-react";
import toast from "react-hot-toast";

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
  validateDateOfBirth,
  validatePassword,
} from "@/lib/validation";
import { DEFAULT_COUNTRY_ISO } from "@/lib/countries";
import { api, extractApiError } from "@/lib/api";

const DummyAvatar = () => (
  <img
    src="/dummy-avatar.jpg"
    alt="Professional male avatar"
    className="h-full w-full object-cover bg-[#E2E8F0]"
  />
);

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
  avatarUrl: "",
};

/**
 * Primary registration form component.
 * Handles user input, local validation, and communicates with the backend /auth/register/start endpoint.
 * On success, routes the user to the OTP verification step.
 */
export const RegisterForm = () => {
  const router = useRouter();

  const [data, setData] = useState<RegisterFormData>(initialData);
  const [errors, setErrors] = useState<FormErrors<RegisterFormData>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("empsphere_register_draft");
      if (saved) {
        const parsed = JSON.parse(saved);
        // Do not load sensitive fields
        delete parsed.password;
        delete parsed.confirmPassword;
        setData(prev => ({ ...prev, ...parsed }));
      }
    } catch (e) {
      console.warn("Failed to load registration draft from local storage");
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    if (!isLoaded) return;
    try {
      const draft: Partial<RegisterFormData> = { ...data };
      delete draft.password;
      delete draft.confirmPassword;
      localStorage.setItem("empsphere_register_draft", JSON.stringify(draft));
    } catch (e) {
      console.warn("Failed to save registration draft to local storage");
    }
  }, [data, isLoaded]);

  const setField = <K extends keyof RegisterFormData>(
    key: K,
    value: RegisterFormData[K],
  ) => {
    setData((prev) => {
      const newData = { ...prev, [key]: value };

      // Immediate confirmPassword validation when password changes
      if (key === "password" && newData.confirmPassword) {
        if (value !== newData.confirmPassword) {
          setErrors((errs) => ({
            ...errs,
            confirmPassword: "Passwords do not match.",
          }));
        } else {
          setErrors((errs) => ({ ...errs, confirmPassword: undefined }));
        }
      }

      return newData;
    });

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
        message = !data.confirmPassword
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

    submitForm();
  };

  const submitForm = async () => {
    setIsSubmitting(true);
    setFormError(null);

    try {
      await api.post("/auth/register/start", { ...data, allowSaveDraft: true });
      toast.success("Verification codes sent successfully! Please check your email.");
      router.push(`/verify-otp?email=${encodeURIComponent(data.email)}`);
    } catch (err) {
      const { message, errors: apiErrors } = extractApiError(err);
      if (apiErrors) {
        setErrors((prev) => ({ ...prev, ...apiErrors }));
        setFormError("Please fix the validation errors below.");
      } else {
        setFormError(message || "Registration failed. Please try again later.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClearDraft = () => {
    localStorage.removeItem("empsphere_register_draft");
    setData(initialData);
    setErrors({});
    setFormError(null);
    toast.success("Form draft cleared!");
  };

  const handleEmailBlur = async () => {
    validateField("email");
    if (!data.email || errors.email) return;

    try {
      const res = await api.get<{ draft: Partial<RegisterFormData> | null }>(`/auth/draft/${encodeURIComponent(data.email)}`);
      if (res.data?.draft) {
        setData(prev => ({ ...prev, ...res.data.draft }));
      }
    } catch (err) {
      // Ignore errors fetching draft
      console.warn("Could not fetch draft", err);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setFormError("Please select a valid image file (PNG, JPG, WEBP, GIF)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFormError("Profile image size must be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setField("avatarUrl", reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const isFormValid = Boolean(
    data.firstName.trim() !== "" &&
    data.lastName.trim() !== "" &&
    data.email.trim() !== "" &&
    data.phoneNumber.trim() !== "" &&
    data.department !== "" &&
    data.role !== "" &&
    data.password !== "" &&
    data.confirmPassword !== "" &&
    data.password === data.confirmPassword &&
    data.employeeId.trim() !== "" &&
    data.dateOfBirth !== "" &&
    data.agreeToTerms === true
  );

  const hasErrors = Object.values(errors).some(Boolean);
  const canSubmit = isFormValid && !hasErrors && !isSubmitting;

  // PROFESSIONAL STYLING CLASSES - Comfortable & Compact
  const inputBaseClasses =
    "w-full rounded-xl border-2 py-2 text-[13.5px] font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-medium focus:bg-white focus:border-[#4355CC] focus:ring-3 focus:ring-[#4355CC]/10 focus:outline-none shadow-2xs transition-all";
  const selectBaseClasses =
    "w-full rounded-xl border-2 py-2 text-[13.5px] font-bold focus:bg-white focus:border-[#4355CC] focus:ring-3 focus:ring-[#4355CC]/10 focus:outline-none shadow-2xs transition-all appearance-none cursor-pointer";

  return (
    <div className="w-full">
      {/* Heading */}
      <div className="text-center mb-2.5">
        <h2 className="font-serif text-[22px] sm:text-[25px] font-extrabold text-[#0F172A] tracking-tight">
          Create your account
        </h2>
        <p className="mt-0.5 text-[12.5px] text-slate-500 font-medium">
          Get started with your team&apos;s task management workspace.
        </p>
      </div>

      {formError && (
        <div className="mb-2.5 rounded-xl border-2 border-red-200 bg-red-50 p-2.5 text-[12.5px] font-bold text-red-600 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{formError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-2.5">
        {/* Profile Picture Upload Section */}
        <div className="flex flex-col items-center justify-center pb-0.5">
          <div className="relative group">
            <label
              htmlFor="avatar-upload"
              className="relative group flex w-[52px] h-[52px] cursor-pointer items-center justify-center rounded-full border-2 border-dashed border-slate-300 group-hover:border-[#4355CC] bg-slate-50 overflow-hidden transition-all shadow-2xs"
            >
              {data.avatarUrl ? (
                <img
                  src={data.avatarUrl}
                  alt="Avatar preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <DummyAvatar />
              )}
              <div className="absolute inset-0 bg-black/50 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[9px] font-bold uppercase tracking-wider backdrop-blur-xs">
                <Camera className="w-4 h-4 mb-0.5" />
              </div>
              <input
                id="avatar-upload"
                type="file"
                accept="image/png, image/jpeg, image/webp, image/gif"
                onChange={handleAvatarChange}
                style={{ display: "none" }}
              />
            </label>
            {data.avatarUrl && (
              <button
                type="button"
                onClick={() => setField("avatarUrl", "")}
                className="absolute -top-1 -right-1 p-1 rounded-full bg-red-500 text-white hover:bg-red-600 shadow-md transition-all cursor-pointer"
                title="Remove photo"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          <div className="mt-1 text-center">
            <label
              htmlFor="avatar-upload"
              className="text-[11.5px] font-bold text-[#4355CC] hover:text-[#3644A8] cursor-pointer inline-flex items-center gap-1"
            >
              <Upload className="w-3 h-3" />
              {data.avatarUrl ? "Change Photo" : "Add Profile Photo (Optional)"}
            </label>
          </div>
        </div>

        {/* ROW 1: First Name & Last Name */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[12.5px] font-bold text-slate-800 mb-1">
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
                placeholder="First name"
                className={`${inputBaseClasses} pl-10 pr-3.5 ${
                  errors.firstName
                    ? "border-red-400 bg-red-50/30"
                    : "border-slate-300 bg-white shadow-[0_2px_10px_-3px_rgba(15,23,42,0.08)] hover:border-[#4355CC]/50"
                }`}
                maxLength={12}
                autoComplete="given-name"
              />
            </div>
            {errors.firstName && (
              <p className="mt-1 text-[11.5px] font-bold text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.firstName}
              </p>
            )}
          </div>

          <div>
            <label className="block text-[12.5px] font-bold text-slate-800 mb-1">
              Last Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                name="lastName"
                value={data.lastName}
                onChange={(e) => {
                  const value = e.target.value;
                  if (/ {2,}/.test(value)) return;
                  setField("lastName", normalizeName(value));
                }}
                onBlur={() => validateField("lastName")}
                placeholder="Last name"
                className={`${inputBaseClasses} pl-10 pr-3.5 ${
                  errors.lastName
                    ? "border-red-400 bg-red-50/30"
                    : "border-slate-300 bg-white shadow-[0_2px_10px_-3px_rgba(15,23,42,0.08)] hover:border-[#4355CC]/50"
                }`}
                maxLength={40}
                autoComplete="family-name"
              />
            </div>
            {errors.lastName && (
              <p className="mt-1 text-[11.5px] font-bold text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.lastName}
              </p>
            )}
          </div>
        </div>

        {/* ROW 2: Work Email & Phone Number */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[12.5px] font-bold text-slate-800 mb-1">
              Work Email <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="email"
                name="email"
                value={data.email}
                onChange={(e) =>
                  setField("email", e.target.value.replace(/\s/g, ""))
                }
                onKeyDown={(e) => {
                  if (e.key === " ") e.preventDefault();
                }}
                onBlur={handleEmailBlur}
                placeholder="you@company.com"
                maxLength={50}
                className={`${inputBaseClasses} pl-10 pr-3.5 ${
                  errors.email
                    ? "border-red-400 bg-red-50/30"
                    : "border-slate-300 bg-white shadow-[0_2px_10px_-3px_rgba(15,23,42,0.08)] hover:border-[#4355CC]/50"
                }`}
                autoComplete="email"
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-[11.5px] font-bold text-red-500 flex items-center gap-1">
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
              onBlur={() => validateField("phoneNumber")}
              error={errors.phoneNumber}
              required
            />
          </div>
        </div>

        {/* ROW 3: Department & Your Role */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[12.5px] font-bold text-slate-800 mb-1">
              Department <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                name="department"
                value={data.department}
                onChange={(e) => setField("department", e.target.value)}
                onBlur={() => validateField("department")}
                className={`${selectBaseClasses} pl-3.5 pr-10 ${
                  errors.department
                    ? "border-red-400 bg-red-50/30"
                    : "border-slate-300 bg-white shadow-[0_2px_10px_-3px_rgba(15,23,42,0.08)] hover:border-[#4355CC]/50"
                } ${data.department ? "text-slate-900" : "text-slate-400 font-medium"}`}
              >
                <option value="" disabled>
                  Select department
                </option>
                {DEPARTMENTS.map((dept) => (
                  <option
                    key={dept}
                    value={dept}
                    className="text-slate-900 font-bold"
                  >
                    {dept}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
            {errors.department && (
              <p className="mt-1 text-[11.5px] font-bold text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.department}
              </p>
            )}
          </div>

          <div>
            <label className="block text-[12.5px] font-bold text-slate-800 mb-1">
              Your Role <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                name="role"
                value={data.role}
                onChange={(e) => setField("role", e.target.value)}
                onBlur={() => validateField("role")}
                className={`${selectBaseClasses} pl-3.5 pr-10 ${
                  errors.role
                    ? "border-red-400 bg-red-50/30"
                    : "border-slate-300 bg-white shadow-[0_2px_10px_-3px_rgba(15,23,42,0.08)] hover:border-[#4355CC]/50"
                } ${data.role ? "text-slate-900" : "text-slate-400 font-medium"}`}
              >
                <option value="" disabled>
                  Select your role
                </option>
                {ROLES.map((r) => (
                  <option
                    key={r}
                    value={r}
                    className="text-slate-900 font-bold"
                  >
                    {r}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
            {errors.role && (
              <p className="mt-1 text-[11.5px] font-bold text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.role}
              </p>
            )}
          </div>
        </div>

        {/* ROW 4: Password & Confirm Password */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[12.5px] font-bold text-slate-800 mb-1">
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
                className={`${inputBaseClasses} pl-10 pr-10 ${
                  errors.password
                    ? "border-red-400 bg-red-50/30"
                    : "border-slate-300 bg-white shadow-[0_2px_10px_-3px_rgba(15,23,42,0.08)] hover:border-[#4355CC]/50"
                }`}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
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
              <p className="mt-1 text-[11.5px] font-bold text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.password}
              </p>
            )}
          </div>

          <div>
            <label className="block text-[12.5px] font-bold text-slate-800 mb-1">
              Confirm Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={data.confirmPassword}
                onChange={(e) => {
                  const val = e.target.value;
                  setData((prev) => ({ ...prev, confirmPassword: val }));
                  if (val && data.password !== val) {
                    setErrors((prev) => ({
                      ...prev,
                      confirmPassword: "Passwords do not match.",
                    }));
                  } else {
                    setErrors((prev) => ({
                      ...prev,
                      confirmPassword: undefined,
                    }));
                  }
                }}
                onBlur={() => validateField("confirmPassword")}
                placeholder="Confirm password"
                className={`${inputBaseClasses} pl-10 pr-10 ${
                  errors.confirmPassword
                    ? "border-red-400 bg-red-50/30"
                    : "border-slate-300 bg-white shadow-[0_2px_10px_-3px_rgba(15,23,42,0.08)] hover:border-[#4355CC]/50"
                }`}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
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
              <p className="mt-1 text-[11.5px] font-bold text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.confirmPassword}
              </p>
            )}
          </div>
        </div>

        {/* ROW 5: Employee ID & Date of Birth */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[12.5px] font-bold text-slate-800 mb-1">
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
                className={`${inputBaseClasses} pl-10 pr-3.5 ${
                  errors.employeeId
                    ? "border-red-400 bg-red-50/30"
                    : "border-slate-300 bg-white shadow-[0_2px_10px_-3px_rgba(15,23,42,0.08)] hover:border-[#4355CC]/50"
                }`}
              />
            </div>
            {errors.employeeId && (
              <p className="mt-1 text-[11.5px] font-bold text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.employeeId}
              </p>
            )}
          </div>

          <div>
            <label className="block text-[12.5px] font-bold text-slate-800 mb-1">
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
                className={`${inputBaseClasses} pl-10 pr-3.5 ${
                  errors.dateOfBirth
                    ? "border-red-400 bg-red-50/30"
                    : "border-slate-300 bg-white shadow-[0_2px_10px_-3px_rgba(15,23,42,0.08)] hover:border-[#4355CC]/50"
                } cursor-pointer`}
              />
            </div>
            {errors.dateOfBirth ? (
              <p className="mt-1 text-[11.5px] font-bold text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.dateOfBirth}
              </p>
            ) : (
              <p className="mt-1 text-[11px] font-semibold text-slate-500">
                Must be at least 18 years old (born on or before {MAX_DOB})
              </p>
            )}
          </div>
        </div>

        {/* TERMS & PRIVACY */}
        <div className="pt-0.5">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={data.agreeToTerms}
              onChange={(e) => setField("agreeToTerms", e.target.checked)}
              className="h-4 w-4 rounded-md border-2 border-slate-300 text-[#4355CC] focus:ring-[#4355CC]/20 cursor-pointer"
            />
            <span className="text-[12px] text-slate-700 font-bold">
              I agree to the{" "}
              <Link
                href="/terms"
                className="text-[#4355CC] hover:underline hover:text-[#3644A8]"
              >
                Terms of Service
              </Link>{" "}
              &{" "}
              <Link
                href="/privacy"
                className="text-[#4355CC] hover:underline hover:text-[#3644A8]"
              >
                Privacy Policy
              </Link>
            </span>
          </label>
          {errors.agreeToTerms && (
            <p className="mt-1 text-[11.5px] font-bold text-red-500 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.agreeToTerms}
            </p>
          )}
        </div>

        {/* SUBMIT BUTTON */}
        <div className="pt-1">
          {/* Actions */}
          <div className="flex flex-col gap-1.5">
            <button
              type="submit"
              disabled={!canSubmit}
              className={`group relative flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-[14px] font-extrabold text-white transition-all overflow-hidden ${
                !canSubmit
                  ? "bg-[#4355CC]/40 text-white/70 cursor-not-allowed opacity-50 backdrop-blur-sm pointer-events-none shadow-none"
                  : "bg-[#4355CC] hover:bg-[#3644A8] hover:shadow-[0_8px_20px_-6px_rgba(67,85,204,0.5)] hover:-translate-y-0.5 cursor-pointer"
              }`}
            >
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer" />
              {isSubmitting ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  Create Account
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleClearDraft}
              className="flex items-center justify-center gap-1 text-[11.5px] font-bold text-slate-400 hover:text-slate-600 transition-colors py-0.5"
            >
              <Eraser className="w-3.5 h-3.5" />
              Clear Form Draft
            </button>
          </div>
        </div>

        <div className="text-center pt-0.5">
          <p className="text-[12px] font-semibold text-slate-500">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-[#4355CC] hover:text-[#3644A8] hover:underline ml-0.5 font-bold"
            >
              Log in
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
};
