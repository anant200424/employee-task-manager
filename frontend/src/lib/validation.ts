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
  label: string
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
export const validateFirstName = (
  value: string
): string | undefined => {
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



export const validateEmail = (
  value: string
): string | undefined => {
  const email = value.trim();

  if (!email) {
    return "Please enter a valid email address.";
  }

  // No spaces
  if (/\s/.test(email)) {
    return "Email address cannot contain spaces.";
  }

  // Only one @ is allowed
  if ((email.match(/@/g) || []).length !== 1) {
    return "Please enter a valid email address.";
  }

  // No consecutive full stops
  if (email.includes("..")) {
    return "Email address cannot contain consecutive dots.";
  }

  // Cannot start or end with a dot
  if (
    email.startsWith(".") ||
    email.endsWith(".")
  ) {
    return "Please enter a valid email address.";
  }

  // Complete email format validation
  if (!EMAIL_REGEX.test(email)) {
    return "Please enter a valid email address.";
  }

  return undefined;
};

export const validateDateOfBirth = (
  value: string
): string | undefined => {
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
  countryIso: string
): string | undefined => {
  const country = getCountryByIso(countryIso);
  const cleaned = digits.replace(/\D/g, "");

  if (!cleaned) {
    return "Please enter a valid mobile number.";
  }

  if (
    country &&
    cleaned.length !== country.exampleDigits
  ) {
    return `Enter a valid ${country.exampleDigits}-digit mobile number for ${country.name}`;
  }

  const isValid = isValidPhoneNumber(
    cleaned,
    countryIso as CountryCode
  );

  if (!isValid) {
    return `Please enter a valid mobile number for ${
      country?.name || "the selected country"
    }`;
  }

  return undefined;
};

export interface PasswordStrength {
  score: number;

  label:
    | "Very weak"
    | "Weak"
    | "Fair"
    | "Strong"
    | "Very strong";

  checks: {
    length: boolean;
    lowercase: boolean;
    uppercase: boolean;
    number: boolean;
    special: boolean;
  };
}

export const getPasswordStrength = (
  password: string
): PasswordStrength => {
  const checks = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  const score =
    Object.values(checks).filter(Boolean).length - 1;

  const clampedScore = Math.max(
    0,
    Math.min(4, score)
  );

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

export const validatePassword = (
  value: string
): string | undefined => {
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

export const validateDepartment = (value: string): string | undefined => {
  if (!value || !value.trim()) {
    return "Please select your department.";
  }
  return undefined;
};

export const validateRole = (value: string): string | undefined => {
  if (!value || !value.trim()) {
    return "Please select your role.";
  }
  return undefined;
};

export const validateEmployeeId = (value: string): string | undefined => {
  if (!value || !value.trim()) {
    return "Please enter your employee ID.";
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
  data: RegisterFormData
): FormErrors<RegisterFormData> => {
  const errors: FormErrors<RegisterFormData> = {};

  // First Name uses strict validation.
  const firstNameErr = validateFirstName(
    data.firstName
  );

  if (firstNameErr) {
    errors.firstName = firstNameErr;
  }

  // Last Name keeps existing validation.
  const lastNameErr = validateName(
    data.lastName,
    "Last name"
  );

  if (lastNameErr) {
    errors.lastName = lastNameErr;
  }

  const emailErr = validateEmail(data.email);

  if (emailErr) {
    errors.email = emailErr;
  }

  const phoneErr = validatePhoneNumber(
    data.phoneNumber,
    data.countryCode
  );

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

  const empIdErr = validateEmployeeId(data.employeeId);
  if (empIdErr) {
    errors.employeeId = empIdErr;
  }

  const dobErr = validateDateOfBirth(data.dateOfBirth);
  if (dobErr) {
    errors.dateOfBirth = dobErr;
  }

  const passwordErr = validatePassword(
    data.password
  );

  if (passwordErr) {
    errors.password = passwordErr;
  }

  if (!data.confirmPassword) {
    errors.confirmPassword =
      "Please confirm your password.";
  } else if (
    data.password !== data.confirmPassword
  ) {
    errors.confirmPassword =
      "Passwords do not match.";
  }

  if (!data.agreeToTerms) {
    errors.agreeToTerms =
      "You must agree to the Terms of Service & Privacy Policy.";
  }

  return errors;
};

export const validateLoginForm = (
  data: LoginFormData
): FormErrors<LoginFormData> => {
  const errors: FormErrors<LoginFormData> = {};

  const emailErr = validateEmail(data.email);

  if (emailErr) {
    errors.email = emailErr;
  }

  if (!data.password) {
    errors.password = "Please enter your password.";
  }

  return errors;
};

export const validateResetPasswordForm = (
  data: ResetPasswordFormData
): FormErrors<ResetPasswordFormData> => {
  const errors: FormErrors<ResetPasswordFormData> = {};

  const passwordErr = validatePassword(
    data.password
  );

  if (passwordErr) {
    errors.password = passwordErr;
  }

  if (!data.confirmPassword) {
    errors.confirmPassword =
      "Please confirm your password.";
  } else if (
    data.password !== data.confirmPassword
  ) {
    errors.confirmPassword =
      "Password not match.";
  }

  return errors;
};