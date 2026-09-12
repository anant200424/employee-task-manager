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
  Sparkles,
} from "lucide-react";
import toast from "react-hot-toast";

import { PhoneField } from "@/components/auth/PhoneField";
import { useLanguage } from "@/context/LanguageContext";
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

/**
 * Generate a standard Employee ID: EMP-XXXX
 */
export const generateEmployeeId = () => {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `EMP-${randomNum}`;
};

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
  const { t } = useLanguage();

  const [data, setData] = useState<RegisterFormData>(initialData);
  const [errors, setErrors] = useState<FormErrors<RegisterFormData>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount & ensure employeeId is auto-assigned
  useEffect(() => {
    try {
      const saved = localStorage.getItem("empsphere_register_draft");
      if (saved) {
        const parsed = JSON.parse(saved);
        // Do not load sensitive fields
        delete parsed.password;
        delete parsed.confirmPassword;
        if (!parsed.employeeId || typeof parsed.employeeId !== "string") {
          parsed.employeeId = generateEmployeeId();
        }
        setData((prev) => ({ ...prev, ...parsed }));
      } else {
        setData((prev) => ({
          ...prev,
          employeeId: prev.employeeId || generateEmployeeId(),
        }));
      }
    } catch (e) {
      console.warn("Failed to load registration draft from local storage");
      setData((prev) => ({
        ...prev,
        employeeId: prev.employeeId || generateEmployeeId(),
      }));
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

    const empId = data.employeeId || generateEmployeeId();

    try {
      await api.post("/auth/register/start", {
        ...data,
        employeeId: empId,
        allowSaveDraft: true,
      });
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
    setData({
      ...initialData,
      employeeId: generateEmployeeId(),
    });
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
    data.dateOfBirth !== "" &&
    data.agreeToTerms === true
  );

  const hasErrors = Object.values(errors).some(Boolean);
  const canSubmit = isFormValid && !hasErrors && !isSubmitting;

  // PROFESSIONAL STYLING CLASSES - Comfortable, Compact & Accessible (WCAG 2.1 AA)
  const inputBaseClasses =
    "w-full min-w-0 box-border rounded-xl border-2 py-2 text-[13.5px] sm:text-[14px] font-bold text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-500 placeholder:font-medium focus:bg-white focus:dark:bg-slate-800 focus:border-[#4355CC] dark:focus:border-indigo-500 focus:ring-4 focus:ring-[#4355CC]/15 dark:focus:ring-indigo-500/20 focus:outline-none shadow-2xs transition-all";
  const selectBaseClasses =
    "w-full min-w-0 box-border rounded-xl border-2 py-2 text-[13.5px] sm:text-[14px] font-bold text-slate-900 dark:text-white focus:bg-white focus:dark:bg-slate-800 focus:border-[#4355CC] dark:focus:border-indigo-500 focus:ring-4 focus:ring-[#4355CC]/15 dark:focus:ring-indigo-500/20 focus:outline-none shadow-2xs transition-all appearance-none cursor-pointer";

  return (
    <div className="w-full min-w-0 max-w-full">
      {/* Heading & Instructions */}
      <div className="text-center mb-2.5">
        <h2 className="font-serif text-[20px] xs:text-[22px] sm:text-[25px] font-black text-[#0F172A] dark:text-white tracking-tight break-words">
          {t("auth_create_title", "Create your account")}
        </h2>
        <p className="mt-0.5 text-[12px] sm:text-[13px] text-slate-600 dark:text-slate-400 font-medium break-words">
          {t("auth_create_subtitle", "Get started with your team's task management workspace.")}
        </p>
        <p className="mt-1 text-[11px] sm:text-[11.5px] text-slate-600 dark:text-slate-400 font-medium break-words">
          {t("auth_required_hint", "Fields marked with an asterisk (*) are required.")}
        </p>
      </div>

      {formError && (
        <div
          role="alert"
          aria-live="assertive"
          className="mb-2.5 rounded-xl border-2 border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 p-2.5 text-[12.5px] sm:text-[13px] font-bold text-red-700 dark:text-red-300 flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400" aria-hidden="true" />
          <span className="break-words">{formError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-2.5 w-full min-w-0 max-w-full">
        {/* Profile Picture Upload Section */}
        <div className="flex flex-col items-center justify-center pb-0.5">
          <div className="relative group">
            <label
              htmlFor="avatar-upload"
              className="relative group flex w-[52px] h-[52px] cursor-pointer items-center justify-center rounded-full border-2 border-dashed border-slate-300 dark:border-slate-700 group-hover:border-[#4355CC] dark:group-hover:border-indigo-400 focus-within:ring-4 focus-within:ring-[#4355CC]/20 bg-slate-50 dark:bg-slate-800 overflow-hidden transition-all shadow-2xs"
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
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-black/50 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[9px] font-bold uppercase tracking-wider backdrop-blur-xs"
              >
                <Camera className="w-4 h-4 mb-0.5" />
              </div>
              <input
                id="avatar-upload"
                type="file"
                accept="image/png, image/jpeg, image/webp, image/gif"
                onChange={handleAvatarChange}
                aria-label="Upload profile photo (Optional)"
                className="sr-only"
              />
            </label>
            {data.avatarUrl && (
              <button
                type="button"
                onClick={() => setField("avatarUrl", "")}
                className="absolute -top-1 -right-1 p-1 rounded-full bg-red-600 text-white hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-[#4355CC] shadow-md transition-all cursor-pointer"
                title="Remove photo"
                aria-label="Remove profile photo"
              >
                <X className="w-3 h-3" aria-hidden="true" />
              </button>
            )}
          </div>
          <div className="mt-1 text-center">
            <label
              htmlFor="avatar-upload"
              className="text-[12px] font-bold text-[#3644A8] dark:text-indigo-400 hover:text-[#25328A] dark:hover:text-indigo-300 cursor-pointer inline-flex items-center gap-1 focus-within:underline"
            >
              <Upload className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{data.avatarUrl ? "Change Photo" : "Add Profile Photo (Optional)"}</span>
            </label>
          </div>
        </div>

        {/* ROW 1: First Name & Last Name */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 w-full min-w-0">
          <div className="w-full min-w-0">
            <label
              htmlFor="firstName"
              className="block text-[12.5px] font-bold text-slate-800 dark:text-slate-200 mb-1"
            >
              {t("auth_first_name", "First Name")}{" "}
              <span className="text-red-600 dark:text-red-400 font-black" aria-hidden="true">
                *
              </span>
              <span className="sr-only"> (required)</span>
            </label>
            <div className="relative">
              <UserIcon
                aria-hidden="true"
                className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 dark:text-slate-400 pointer-events-none"
              />
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={data.firstName}
                onChange={(e) =>
                  setField("firstName", normalizeFirstName(e.target.value))
                }
                onBlur={() => validateField("firstName")}
                placeholder="First name"
                aria-required="true"
                aria-invalid={Boolean(errors.firstName)}
                aria-describedby={errors.firstName ? "firstName-error" : undefined}
                className={`${inputBaseClasses} pl-10 pr-3.5 ${
                  errors.firstName
                    ? "border-red-400 bg-red-50/30 dark:bg-red-950/20"
                    : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/90 shadow-[0_2px_10px_-3px_rgba(15,23,42,0.08)] hover:border-[#4355CC]/50 dark:hover:border-indigo-500/50"
                }`}
                maxLength={12}
                autoComplete="given-name"
              />
            </div>
            {errors.firstName && (
              <p
                id="firstName-error"
                role="alert"
                className="mt-1 text-[12px] font-bold text-red-700 dark:text-red-400 flex items-center gap-1 animate-in fade-in duration-150"
              >
                <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>{errors.firstName}</span>
              </p>
            )}
          </div>

          <div className="w-full min-w-0">
            <label
              htmlFor="lastName"
              className="block text-[12.5px] font-bold text-slate-800 dark:text-slate-200 mb-1"
            >
              {t("auth_last_name", "Last Name")}{" "}
              <span className="text-red-600 dark:text-red-400 font-black" aria-hidden="true">
                *
              </span>
              <span className="sr-only"> (required)</span>
            </label>
            <div className="relative">
              <UserIcon
                aria-hidden="true"
                className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 dark:text-slate-400 pointer-events-none"
              />
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={data.lastName}
                onChange={(e) => {
                  const value = e.target.value;
                  if (/ {2,}/.test(value)) return;
                  setField("lastName", normalizeName(value));
                }}
                onBlur={() => validateField("lastName")}
                placeholder="Last name"
                aria-required="true"
                aria-invalid={Boolean(errors.lastName)}
                aria-describedby={errors.lastName ? "lastName-error" : undefined}
                className={`${inputBaseClasses} pl-10 pr-3.5 ${
                  errors.lastName
                    ? "border-red-400 bg-red-50/30 dark:bg-red-950/20"
                    : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/90 shadow-[0_2px_10px_-3px_rgba(15,23,42,0.08)] hover:border-[#4355CC]/50 dark:hover:border-indigo-500/50"
                }`}
                maxLength={40}
                autoComplete="family-name"
              />
            </div>
            {errors.lastName && (
              <p
                id="lastName-error"
                role="alert"
                className="mt-1 text-[12px] font-bold text-red-700 dark:text-red-400 flex items-center gap-1 animate-in fade-in duration-150"
              >
                <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>{errors.lastName}</span>
              </p>
            )}
          </div>
        </div>

        {/* ROW 2: Work Email & Phone Number */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 w-full min-w-0">
          <div className="w-full min-w-0">
            <label
              htmlFor="email"
              className="block text-[12.5px] font-bold text-slate-800 dark:text-slate-200 mb-1"
            >
              {t("auth_work_email", "Work Email")}{" "}
              <span className="text-red-600 dark:text-red-400 font-black" aria-hidden="true">
                *
              </span>
              <span className="sr-only"> (required)</span>
            </label>
            <div className="relative">
              <Mail
                aria-hidden="true"
                className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 dark:text-slate-400 pointer-events-none"
              />
              <input
                type="email"
                id="email"
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
                aria-required="true"
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? "email-error" : undefined}
                className={`${inputBaseClasses} pl-10 pr-3.5 ${
                  errors.email
                    ? "border-red-400 bg-red-50/30 dark:bg-red-950/20"
                    : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/90 shadow-[0_2px_10px_-3px_rgba(15,23,42,0.08)] hover:border-[#4355CC]/50 dark:hover:border-indigo-500/50"
                }`}
                autoComplete="email"
              />
            </div>
            {errors.email && (
              <p
                id="email-error"
                role="alert"
                className="mt-1 text-[12px] font-bold text-red-700 dark:text-red-400 flex items-center gap-1 animate-in fade-in duration-150"
              >
                <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>{errors.email}</span>
              </p>
            )}
          </div>

          <div className="w-full min-w-0">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 w-full min-w-0">
          <div className="w-full min-w-0">
            <label
              htmlFor="department"
              className="block text-[12.5px] font-bold text-slate-800 dark:text-slate-200 mb-1"
            >
              {t("auth_department", "Department")}{" "}
              <span className="text-red-600 dark:text-red-400 font-black" aria-hidden="true">
                *
              </span>
              <span className="sr-only"> (required)</span>
            </label>
            <div className="relative">
              <select
                id="department"
                name="department"
                value={data.department}
                onChange={(e) => setField("department", e.target.value)}
                onBlur={() => validateField("department")}
                aria-required="true"
                aria-invalid={Boolean(errors.department)}
                aria-describedby={errors.department ? "department-error" : undefined}
                className={`${selectBaseClasses} pl-3.5 pr-10 ${
                  errors.department
                    ? "border-red-400 bg-red-50/30 dark:bg-red-950/20"
                    : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/90 shadow-[0_2px_10px_-3px_rgba(15,23,42,0.08)] hover:border-[#4355CC]/50 dark:hover:border-indigo-500/50"
                } ${data.department ? "text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-400 font-medium"}`}
              >
                <option value="" disabled className="dark:bg-slate-900 dark:text-slate-400">
                  {t("auth_select_department", "Select department")}
                </option>
                {DEPARTMENTS.map((dept) => (
                  <option
                    key={dept}
                    value={dept}
                    className="text-slate-900 dark:text-white dark:bg-slate-900 font-bold"
                  >
                    {dept}
                  </option>
                ))}
              </select>
              <ChevronDown
                aria-hidden="true"
                className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 dark:text-slate-400 pointer-events-none"
              />
            </div>
            {errors.department && (
              <p
                id="department-error"
                role="alert"
                className="mt-1 text-[12px] font-bold text-red-700 dark:text-red-400 flex items-center gap-1 animate-in fade-in duration-150"
              >
                <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>{errors.department}</span>
              </p>
            )}
          </div>

          <div className="w-full min-w-0">
            <label
              htmlFor="role"
              className="block text-[12.5px] font-bold text-slate-800 dark:text-slate-200 mb-1"
            >
              {t("auth_role", "Your Role")}{" "}
              <span className="text-red-600 dark:text-red-400 font-black" aria-hidden="true">
                *
              </span>
              <span className="sr-only"> (required)</span>
            </label>
            <div className="relative">
              <select
                id="role"
                name="role"
                value={data.role}
                onChange={(e) => setField("role", e.target.value)}
                onBlur={() => validateField("role")}
                aria-required="true"
                aria-invalid={Boolean(errors.role)}
                aria-describedby={errors.role ? "role-error" : undefined}
                className={`${selectBaseClasses} pl-3.5 pr-10 ${
                  errors.role
                    ? "border-red-400 bg-red-50/30 dark:bg-red-950/20"
                    : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/90 shadow-[0_2px_10px_-3px_rgba(15,23,42,0.08)] hover:border-[#4355CC]/50 dark:hover:border-indigo-500/50"
                } ${data.role ? "text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-400 font-medium"}`}
              >
                <option value="" disabled className="dark:bg-slate-900 dark:text-slate-400">
                  {t("auth_select_role", "Select your role")}
                </option>
                {ROLES.map((r) => (
                  <option
                    key={r}
                    value={r}
                    className="text-slate-900 dark:text-white dark:bg-slate-900 font-bold"
                  >
                    {r}
                  </option>
                ))}
              </select>
              <ChevronDown
                aria-hidden="true"
                className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 dark:text-slate-400 pointer-events-none"
              />
            </div>
            {errors.role && (
              <p
                id="role-error"
                role="alert"
                className="mt-1 text-[12px] font-bold text-red-700 dark:text-red-400 flex items-center gap-1 animate-in fade-in duration-150"
              >
                <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>{errors.role}</span>
              </p>
            )}
          </div>
        </div>

        {/* ROW 4: Password & Confirm Password */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 w-full min-w-0">
          <div className="w-full min-w-0">
            <label
              htmlFor="password"
              className="block text-[12.5px] font-bold text-slate-800 dark:text-slate-200 mb-1"
            >
              {t("auth_password", "Password")}{" "}
              <span className="text-red-600 dark:text-red-400 font-black" aria-hidden="true">
                *
              </span>
              <span className="sr-only"> (required)</span>
            </label>
            <div className="relative">
              <Lock
                aria-hidden="true"
                className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 dark:text-slate-400 pointer-events-none"
              />
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={data.password}
                onChange={(e) => setField("password", e.target.value)}
                onBlur={() => validateField("password")}
                placeholder="Create a password"
                aria-required="true"
                aria-invalid={Boolean(errors.password)}
                aria-describedby={errors.password ? "password-error" : undefined}
                className={`${inputBaseClasses} pl-10 pr-10 ${
                  errors.password
                    ? "border-red-400 bg-red-50/30 dark:bg-red-950/20"
                    : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/90 shadow-[0_2px_10px_-3px_rgba(15,23,42,0.08)] hover:border-[#4355CC]/50 dark:hover:border-indigo-500/50"
                }`}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 focus-visible:outline-2 focus-visible:outline-[#4355CC] rounded-sm p-0.5 transition-colors cursor-pointer"
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
              >
                {showPassword ? (
                  <Eye className="w-4 h-4" aria-hidden="true" />
                ) : (
                  <EyeOff className="w-4 h-4" aria-hidden="true" />
                )}
              </button>
            </div>
            {errors.password && (
              <p
                id="password-error"
                role="alert"
                className="mt-1 text-[12px] font-bold text-red-700 dark:text-red-400 flex items-center gap-1 animate-in fade-in duration-150"
              >
                <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>{errors.password}</span>
              </p>
            )}
          </div>

          <div className="w-full min-w-0">
            <label
              htmlFor="confirmPassword"
              className="block text-[12.5px] font-bold text-slate-800 dark:text-slate-200 mb-1"
            >
              {t("auth_confirm_password", "Confirm Password")}{" "}
              <span className="text-red-600 dark:text-red-400 font-black" aria-hidden="true">
                *
              </span>
              <span className="sr-only"> (required)</span>
            </label>
            <div className="relative">
              <Lock
                aria-hidden="true"
                className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 dark:text-slate-400 pointer-events-none"
              />
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
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
                aria-required="true"
                aria-invalid={Boolean(errors.confirmPassword)}
                aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
                className={`${inputBaseClasses} pl-10 pr-10 ${
                  errors.confirmPassword
                    ? "border-red-400 bg-red-50/30 dark:bg-red-950/20"
                    : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/90 shadow-[0_2px_10px_-3px_rgba(15,23,42,0.08)] hover:border-[#4355CC]/50 dark:hover:border-indigo-500/50"
                }`}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 focus-visible:outline-2 focus-visible:outline-[#4355CC] rounded-sm p-0.5 transition-colors cursor-pointer"
                aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                aria-pressed={showConfirmPassword}
              >
                {showConfirmPassword ? (
                  <Eye className="w-4 h-4" aria-hidden="true" />
                ) : (
                  <EyeOff className="w-4 h-4" aria-hidden="true" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p
                id="confirmPassword-error"
                role="alert"
                className="mt-1 text-[12px] font-bold text-red-700 dark:text-red-400 flex items-center gap-1 animate-in fade-in duration-150"
              >
                <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>{errors.confirmPassword}</span>
              </p>
            )}
          </div>
        </div>

        {/* ROW 5: Employee ID & Date of Birth */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 w-full min-w-0">
          <div className="w-full min-w-0">
            <div className="flex items-center justify-between mb-1">
              <label
                htmlFor="employeeId"
                className="block text-[12.5px] font-bold text-slate-800 dark:text-slate-200"
              >
                {t("auth_emp_id", "Employee ID")}{" "}
                <span className="text-red-600 dark:text-red-400 font-black" aria-hidden="true">
                  *
                </span>
                <span className="sr-only"> (auto-generated)</span>
              </label>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-[10px] font-extrabold text-[#4355CC] dark:text-indigo-400">
                <Sparkles className="w-2.5 h-2.5 text-[#4355CC] dark:text-indigo-400" aria-hidden="true" />
                Auto-assigned
              </span>
            </div>
            <div className="relative">
              <ShieldCheck
                aria-hidden="true"
                className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4355CC] dark:text-indigo-400 pointer-events-none"
              />
              <input
                type="text"
                id="employeeId"
                name="employeeId"
                value={data.employeeId || "Generating ID..."}
                readOnly
                aria-readonly="true"
                tabIndex={-1}
                className={`${inputBaseClasses} pl-10 pr-3.5 font-mono bg-slate-100/80 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 cursor-not-allowed select-none`}
              />
            </div>
            <p className="mt-1 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
              {t("auth_emp_id_hint", "Assigned automatically. Can be edited by admin later.")}
            </p>
          </div>

          <div className="w-full min-w-0">
            <label
              htmlFor="dateOfBirth"
              className="block text-[12.5px] font-bold text-slate-800 dark:text-slate-200 mb-1"
            >
              {t("auth_dob", "Date of Birth")}{" "}
              <span className="text-red-600 dark:text-red-400 font-black" aria-hidden="true">
                *
              </span>
              <span className="sr-only"> (required)</span>
            </label>
            <div className="relative">
              <Calendar
                aria-hidden="true"
                className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 dark:text-slate-400 pointer-events-none"
              />
              <input
                type="date"
                id="dateOfBirth"
                name="dateOfBirth"
                value={data.dateOfBirth}
                max={MAX_DOB}
                min={MIN_DOB}
                onChange={(e) => setField("dateOfBirth", e.target.value)}
                onBlur={() => validateField("dateOfBirth")}
                aria-required="true"
                aria-invalid={Boolean(errors.dateOfBirth)}
                aria-describedby={errors.dateOfBirth ? "dateOfBirth-error" : "dateOfBirth-helper"}
                onClick={(e) => {
                  const input = e.currentTarget as HTMLInputElement;
                  if (typeof input.showPicker === "function") {
                    input.showPicker();
                  }
                }}
                className={`${inputBaseClasses} pl-10 pr-3.5 ${
                  errors.dateOfBirth
                    ? "border-red-400 bg-red-50/30 dark:bg-red-950/20"
                    : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/90 shadow-[0_2px_10px_-3px_rgba(15,23,42,0.08)] hover:border-[#4355CC]/50 dark:hover:border-indigo-500/50"
                } cursor-pointer dark:[color-scheme:dark]`}
              />
            </div>
            {errors.dateOfBirth ? (
              <p
                id="dateOfBirth-error"
                role="alert"
                className="mt-1 text-[12px] font-bold text-red-700 dark:text-red-400 flex items-center gap-1 animate-in fade-in duration-150"
              >
                <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>{errors.dateOfBirth}</span>
              </p>
            ) : (
              <p
                id="dateOfBirth-helper"
                className="mt-1 text-[11.5px] font-semibold text-slate-700 dark:text-slate-400"
              >
                {t("auth_dob_hint", "Must be at least 18 years old")} (born on or before {MAX_DOB})
              </p>
            )}
          </div>
        </div>

        {/* TERMS & PRIVACY */}
        <div className="pt-0.5">
          <label
            htmlFor="agreeToTerms"
            className="flex items-center gap-2.5 cursor-pointer select-none"
          >
            <input
              type="checkbox"
              id="agreeToTerms"
              checked={data.agreeToTerms}
              onChange={(e) => setField("agreeToTerms", e.target.checked)}
              aria-required="true"
              aria-invalid={Boolean(errors.agreeToTerms)}
              aria-describedby={errors.agreeToTerms ? "agreeToTerms-error" : undefined}
              className="h-4.5 w-4.5 rounded-md border-2 border-slate-300 dark:border-slate-700 dark:bg-slate-800 text-[#4355CC] focus:ring-4 focus:ring-[#4355CC]/20 cursor-pointer"
            />
            <span className="text-[12.5px] text-slate-800 dark:text-slate-200 font-bold">
              {t("auth_agree_terms", "I agree to the")}{" "}
              <Link
                href="/terms"
                className="text-[#3644A8] dark:text-indigo-400 hover:underline hover:text-[#25328A] dark:hover:text-indigo-300 focus-visible:outline-2 focus-visible:outline-[#4355CC] rounded-xs"
              >
                {t("auth_terms", "Terms of Service")}
              </Link>{" "}
              {t("auth_and", "&")}{" "}
              <Link
                href="/privacy"
                className="text-[#3644A8] dark:text-indigo-400 hover:underline hover:text-[#25328A] dark:hover:text-indigo-300 focus-visible:outline-2 focus-visible:outline-[#4355CC] rounded-xs"
              >
                {t("auth_privacy", "Privacy Policy")}
              </Link>
            </span>
          </label>
          {errors.agreeToTerms && (
            <p
              id="agreeToTerms-error"
              role="alert"
              className="mt-1 text-[12px] font-bold text-red-700 dark:text-red-400 flex items-center gap-1 animate-in fade-in duration-150"
            >
              <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>{errors.agreeToTerms}</span>
            </p>
          )}
        </div>

        {/* SUBMIT BUTTON */}
        <div className="pt-1">
          <div className="flex flex-col gap-1.5">
            <button
              type="submit"
              disabled={!canSubmit}
              aria-busy={isSubmitting}
              className={`group relative flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-[14px] font-extrabold text-white transition-all overflow-hidden focus-visible:outline-2 focus-visible:outline-[#4355CC] focus-visible:outline-offset-2 ${
                !canSubmit
                  ? "bg-[#4355CC]/40 text-white/70 cursor-not-allowed opacity-60 backdrop-blur-sm pointer-events-none shadow-none"
                  : "bg-[#4355CC] hover:bg-[#3644A8] dark:bg-indigo-600 dark:hover:bg-indigo-500 hover:shadow-[0_8px_20px_-6px_rgba(67,85,204,0.5)] hover:-translate-y-0.5 cursor-pointer"
              }`}
            >
              <div
                aria-hidden="true"
                className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer"
              />
              {isSubmitting ? (
                <div
                  aria-label={t("auth_creating_account", "Creating Account...")}
                  className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
                />
              ) : (
                <>
                  <span>{t("auth_create_btn", "Create Account")}</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleClearDraft}
              className="flex items-center justify-center gap-1 text-[12px] font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors py-0.5 focus-visible:outline-2 focus-visible:outline-[#4355CC] rounded-sm"
            >
              <Eraser className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{t("auth_clear_draft", "Clear Form Draft")}</span>
            </button>
          </div>
        </div>

        <div className="text-center pt-0.5">
          <p className="text-[12.5px] font-semibold text-slate-600 dark:text-slate-400">
            {t("auth_already_have_account", "Already have an account?")}{" "}
            <Link
              href="/login"
              className="text-[#3644A8] dark:text-indigo-400 hover:text-[#25328A] dark:hover:text-indigo-300 hover:underline ml-0.5 font-bold focus-visible:outline-2 focus-visible:outline-[#4355CC] rounded-xs"
            >
              {t("auth_sign_in_link", "Log in")}
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
};
