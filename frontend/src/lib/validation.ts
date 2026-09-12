import { isValidPhoneNumber, CountryCode } from "libphonenumber-js";
import {
  RegisterFormData,
  LoginFormData,
  FormErrors,
  ResetPasswordFormData,
} from "@/types/auth";
import { getCountryByIso } from "./countries";

const NAME_REGEX = /^[A-Za-z\s'-]+$/;
const FIRST_NAME_REGEX = /^[A-Za-z]+$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Normalizes a person's name while typing.
 *
 * Examples:
 * anant       -> Anant
 * anant kumar -> Anant Kumar
 * anant-kumar -> Anant-Kumar
 * o'neil      -> O'Neil
 */
export const normalizeName = (value: string): string => {
  return value
    .replace(/[^A-Za-z\s'-]/g, "")
    .replace(/\b[a-z]/g, (char) => char.toUpperCase());
};

/**
 * First Name normalization.
 *
 * Rules:
 * - English letters only
 * - No spaces
 * - Maximum 12 characters
 * - First letter automatically becomes uppercase
 */
export const normalizeFirstName = (value: string): string => {
  return value
    .replace(/[^A-Za-z]/g, "")
    .slice(0, 12)
    .replace(/^([a-z])/, (char) => char.toUpperCase());
};

/**
 * Normal validation for names such as Last Name.
 *
 * Allows:
 * - Letters
 * - Spaces
 * - Hyphens
 * - Apostrophes
 *
 * Maximum: 40 characters
 */
export const validateName = (
  value: string,
  label: string,
): string | undefined => {
  const trimmed = value.trim();

  if (!trimmed) {
    return `Please enter your ${label}.`;
  }

  if (trimmed.length < 2) {
    return `${label} must be at least 2 characters.`;
  }

  if (trimmed.length > 40) {
    return `${label} cannot exceed 40 characters.`;
  }

  if (/\s{2,}/.test(trimmed)) {
    return `${label} cannot contain multiple consecutive spaces.`;
  }

  if (!NAME_REGEX.test(trimmed)) {
    return `${label} can contain letters, spaces, hyphens or apostrophes only.`;
  }

  return undefined;
};

/**
 * First Name validation.
 *
 * Rules:
 * - Required
 * - Minimum 2 characters
 * - Maximum 12 characters
 * - Spaces NOT allowed
 * - Only English letters A-Z / a-z allowed
 */
export const validateFirstName = (value: string): string | undefined => {
  if (!value) {
    return "Please enter your first name.";
  }

  if (value.length > 12) {
    return "First name cannot exceed 12 characters.";
  }

  if (/\s/.test(value)) {
    return "First name cannot contain spaces.";
  }

  if (!FIRST_NAME_REGEX.test(value)) {
    return "First name can contain letters only.";
  }

  if (value.length < 2) {
    return "First name must be at least 2 characters.";
  }

  return undefined;
};

export const validateEmail = (value: string): string | undefined => {
  const email = (value || "").trim();

  if (!email) {
    return "Please enter your email address.";
  }

  // No spaces
  if (/\s/.test(email)) {
    return "Email address cannot contain spaces.";
  }

  // Check for consecutive dots
  if (email.includes("..")) {
    return "Email address cannot contain consecutive dots (..).";
  }

  // Cannot start or end with a dot
  if (email.startsWith(".") || email.endsWith(".")) {
    return "Email address cannot start or end with a dot.";
  }

  // Must contain an @ symbol
  if (!email.includes("@")) {
    return "Email address must include an '@' symbol.";
  }

  // Only one @ is allowed
  if ((email.match(/@/g) || []).length !== 1) {
    return "Email address can only contain one '@' symbol.";
  }

  // Cannot have dot immediately adjacent to @
  if (email.includes(".@") || email.includes("@.")) {
    return "Email address cannot have a dot immediately adjacent to '@'.";
  }

  const [localPart, domainPart] = email.split("@");

  if (!localPart || localPart.length === 0) {
    return "Please enter the username part before '@'.";
  }

  if (!domainPart || !domainPart.includes(".")) {
    return "Please include a valid domain (e.g. company.com).";
  }

  const domainSubparts = domainPart.split(".");
  const tld = domainSubparts[domainSubparts.length - 1];

  if (!tld || tld.length < 2 || !/^[a-zA-Z]+$/.test(tld)) {
    return "Please enter a valid domain extension (e.g. .com, .org, .io).";
  }

  // Complete email format validation
  if (!EMAIL_REGEX.test(email)) {
    return "Please enter a valid email address format.";
  }

  return undefined;
};

export const validateDateOfBirth = (value: string): string | undefined => {
  if (!value) {
    return "Please enter your date of birth.";
  }

  const dob = new Date(value);

  if (Number.isNaN(dob.getTime())) {
    return "Please enter a valid date.";
  }

  const ageMs = Date.now() - dob.getTime();
  const age = ageMs / (365.25 * 24 * 60 * 60 * 1000);

  if (age < 18) {
    return "You must be at least 18 years old to register.";
  }

  if (age > 100) {
    return "Please enter a valid date of birth.";
  }

  return undefined;
};

// Validates the mobile number strictly against the selected country's
// numbering plan using libphonenumber-js.
export const validatePhoneNumber = (
  digits: string,
  countryIso: string,
): string | undefined => {
  const country = getCountryByIso(countryIso);
  const cleaned = digits.replace(/\D/g, "");

  if (!cleaned) {
    return "Please enter a valid mobile number.";
  }

  if (country && cleaned.length !== country.exampleDigits) {
    return `Enter a valid ${country.exampleDigits}-digit mobile number for ${country.name}`;
  }

  const isValid = isValidPhoneNumber(cleaned, countryIso as CountryCode);

  if (!isValid) {
    return `Please enter a valid mobile number for ${
      country?.name || "the selected country"
    }`;
  }

  return undefined;
};

export interface PasswordStrength {
  score: number;

  label: "Very weak" | "Weak" | "Fair" | "Strong" | "Very strong";

  checks: {
    length: boolean;
    lowercase: boolean;
    uppercase: boolean;
    number: boolean;
    special: boolean;
  };
}

export const getPasswordStrength = (password: string): PasswordStrength => {
  const checks = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  const score = Object.values(checks).filter(Boolean).length - 1;

  const clampedScore = Math.max(0, Math.min(4, score));

  const labels: PasswordStrength["label"][] = [
    "Very weak",
    "Weak",
    "Fair",
    "Strong",
    "Very strong",
  ];

  return {
    score: clampedScore,
    label: labels[clampedScore],
    checks,
  };
};

export const validatePassword = (value: string): string | undefined => {
  if (!value) {
    return "Please enter a valid password.";
  }

  if (value.length < 8) {
    return "Password must be at least 8 characters.";
  }

  if (!/[a-z]/.test(value)) {
    return "Password must include a lowercase letter.";
  }

  if (!/[A-Z]/.test(value)) {
    return "Password must include an uppercase letter.";
  }

  if (!/[0-9]/.test(value)) {
    return "Password must include a number.";
  }

  if (!/[^A-Za-z0-9]/.test(value)) {
    return "Password must include a special character.";
  }

  return undefined;
};

export const validateDepartment = (dept: string): string | undefined => {
  const trimmed = (dept || "").trim();
  if (!trimmed) {
    return "Department is required.";
  }
  if (trimmed.length < 2) {
    return "Department name must be at least 2 characters.";
  }
  if (trimmed.length > 50) {
    return "Department name cannot exceed 50 characters.";
  }
  return undefined;
};

export const validateRole = (role: string): string | undefined => {
  const trimmed = (role || "").trim();
  if (!trimmed) {
    return "Role / Job title is required.";
  }
  if (trimmed.length < 2) {
    return "Role title must be at least 2 characters.";
  }
  if (trimmed.length > 60) {
    return "Role title cannot exceed 60 characters.";
  }
  return undefined;
};

export const validateEmployeeId = (empId: string): string | undefined => {
  const trimmed = (empId || "").trim();
  if (!trimmed) {
    return "Employee ID is required.";
  }
  if (trimmed.length < 3) {
    return "Employee ID must be at least 3 characters.";
  }
  if (trimmed.length > 25) {
    return "Employee ID cannot exceed 25 characters.";
  }
  if (!/^[A-Za-z0-9-_]+$/.test(trimmed)) {
    return "Employee ID can only contain letters, numbers, hyphens and underscores.";
  }
  return undefined;
};

export const validateDateOfJoining = (value: string): string | undefined => {
  if (!value || !value.trim()) {
    return "Please enter your date of joining.";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Please enter a valid date.";
  }
  return undefined;
};

export const validateRegisterForm = (
  data: RegisterFormData,
): FormErrors<RegisterFormData> => {
  const errors: FormErrors<RegisterFormData> = {};

  // First Name uses strict validation.
  const firstNameErr = validateFirstName(data.firstName);

  if (firstNameErr) {
    errors.firstName = firstNameErr;
  }

  // Last Name keeps existing validation.
  const lastNameErr = validateName(data.lastName, "Last name");

  if (lastNameErr) {
    errors.lastName = lastNameErr;
  }

  const emailErr = validateEmail(data.email);

  if (emailErr) {
    errors.email = emailErr;
  }

  const phoneErr = validatePhoneNumber(data.phoneNumber, data.countryCode);

  if (phoneErr) {
    errors.phoneNumber = phoneErr;
  }

  const deptErr = validateDepartment(data.department);
  if (deptErr) {
    errors.department = deptErr;
  }

  const roleErr = validateRole(data.role);
  if (roleErr) {
    errors.role = roleErr;
  }

  if (data.employeeId && data.employeeId.trim()) {
    const empIdErr = validateEmployeeId(data.employeeId);
    if (empIdErr) {
      errors.employeeId = empIdErr;
    }
  }

  const dobErr = validateDateOfBirth(data.dateOfBirth);
  if (dobErr) {
    errors.dateOfBirth = dobErr;
  }

  const passwordErr = validatePassword(data.password);

  if (passwordErr) {
    errors.password = passwordErr;
  }

  if (!data.confirmPassword) {
    errors.confirmPassword = "Please confirm your password.";
  } else if (data.password !== data.confirmPassword) {
    errors.confirmPassword = "Password not match.";
  }

  if (!data.agreeToTerms) {
    errors.agreeToTerms =
      "You must agree to the Terms of Service & Privacy Policy.";
  }

  return errors;
};

export const validateLoginForm = (
  data: LoginFormData,
): FormErrors<LoginFormData> => {
  const errors: FormErrors<LoginFormData> = {};

  const emailErr = validateEmail(data.email);

  if (emailErr) {
    errors.email = emailErr;
  } else if (data.email.length > 254) {
    errors.email = "Email cannot exceed 254 characters.";
  }

  if (!data.password) {
    errors.password = "Please enter your password.";
  } else if (data.password.length > 100) {
    errors.password = "Password cannot exceed 100 characters.";
  } else if (data.password.length < 8) {
    errors.password = "Password must be at least 8 characters.";
  }

  return errors;
};

export const validateResetPasswordForm = (
  data: ResetPasswordFormData,
): FormErrors<ResetPasswordFormData> => {
  const errors: FormErrors<ResetPasswordFormData> = {};

  const passwordErr = validatePassword(data.password);

  if (passwordErr) {
    errors.password = passwordErr;
  }

  if (!data.confirmPassword) {
    errors.confirmPassword = "Please confirm your password.";
  } else if (data.password !== data.confirmPassword) {
    errors.confirmPassword = "Password not match.";
  }

  return errors;
};

/**
 * Professional Task & Employee Validations
 */
export const validateTaskTitle = (title: string): string | undefined => {
  const trimmed = (title || "").trim();
  if (!trimmed) {
    return "Task title is required.";
  }
  if (trimmed.length < 3) {
    return "Task title must be at least 3 characters.";
  }
  if (trimmed.length > 120) {
    return "Task title cannot exceed 120 characters.";
  }
  if (/^[^a-zA-Z0-9]+$/.test(trimmed)) {
    return "Task title must contain alphanumeric characters.";
  }
  return undefined;
};

export const validateTaskDescription = (desc: string): string | undefined => {
  if (desc && desc.length > 3000) {
    return "Task description cannot exceed 3,000 characters.";
  }
  return undefined;
};

export const validateTaskDueDate = (dueDate: string): string | undefined => {
  if (!dueDate) {
    return "Task due date is required.";
  }
  const date = new Date(dueDate);
  if (isNaN(date.getTime())) {
    return "Please provide a valid due date.";
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  if (target < today) {
    return "Due date cannot be in the past.";
  }
  const tenYearsFromNow = new Date(today.getFullYear() + 10, today.getMonth(), today.getDate());
  if (target > tenYearsFromNow) {
    return "Due date cannot be more than 10 years in the future.";
  }
  return undefined;
};

export const validateAssignees = (assignees: string[]): string | undefined => {
  if (!assignees || assignees.length === 0) {
    return "Please select at least one employee assignee.";
  }
  return undefined;
};

export const validatePanNumber = (pan: string): string | undefined => {
  const trimmed = (pan || "").trim().toUpperCase();
  if (!trimmed) return undefined;
  if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(trimmed)) {
    return "Enter a valid 10-character Indian PAN (e.g. ABCDE1234F).";
  }
  return undefined;
};

export const validateAadharNumber = (aadhar: string): string | undefined => {
  const clean = (aadhar || "").trim().replace(/\s+/g, "");
  if (!clean) return undefined;
  if (!/^[0-9]{12}$/.test(clean)) {
    return "Enter a valid 12-digit Aadhaar number.";
  }
  return undefined;
};

export const validateUanNumber = (uan: string): string | undefined => {
  const clean = (uan || "").trim().replace(/\s+/g, "");
  if (!clean) return undefined;
  if (!/^[0-9]{12}$/.test(clean)) {
    return "Enter a valid 12-digit Universal Account Number (UAN).";
  }
  return undefined;
};

export const validateSalaryField = (value: number | string, label: string): string | undefined => {
  if (value === "" || value === undefined || value === null) {
    return `${label} is required.`;
  }
  const num = typeof value === "string" ? Number(value) : value;
  if (isNaN(num)) {
    return `${label} must be a valid number.`;
  }
  if (num < 0) {
    return `${label} cannot be negative.`;
  }
  if (num > 100000000) {
    return `${label} cannot exceed ₹10,00,00,000.`;
  }
  return undefined;
};

export const validateManagerName = (manager: string): string | undefined => {
  const trimmed = (manager || "").trim();
  if (!trimmed) return undefined;
  if (trimmed.length < 2) {
    return "Manager name must be at least 2 characters.";
  }
  if (trimmed.length > 60) {
    return "Manager name cannot exceed 60 characters.";
  }
  if (!/^[A-Za-z\s.'-]+$/.test(trimmed)) {
    return "Manager name can only contain letters, spaces, hyphens and dots.";
  }
  return undefined;
};


