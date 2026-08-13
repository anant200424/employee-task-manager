import { z } from "zod";
import { isValidPhoneNumber, getCountries } from "libphonenumber-js";

const validCountryCodes = getCountries();

const nameField = (label: string) =>
  z
    .string({ required_error: `${label} is required` })
    .trim()
    .min(2, `${label} must be at least 2 characters`)
    .max(40, `${label} cannot exceed 40 characters`)
    .regex(/^[A-Za-z\s'-]+$/, `${label} can only contain letters, spaces, hyphens or apostrophes`);

const passwordField = z
  .string({ required_error: "Password is required" })
  .min(8, "Password must be at least 8 characters")
  .max(64, "Password cannot exceed 64 characters")
  .regex(/[a-z]/, "Password must include a lowercase letter")
  .regex(/[A-Z]/, "Password must include an uppercase letter")
  .regex(/[0-9]/, "Password must include a number")
  .regex(/[^A-Za-z0-9]/, "Password must include a special character");

export const registerSchema = z
  .object({
    firstName: nameField("First name"),
    lastName: nameField("Last name"),
    email: z.string({ required_error: "Email address is required" }).trim().toLowerCase().email("Enter a valid email address"),
    countryCode: z
      .string({ required_error: "Country is required" })
      .refine((val) => validCountryCodes.includes(val as never), "Select a valid country"),
    phoneNumber: z.string({ required_error: "Mobile number is required" }).trim(),
    department: z.string().optional(),
    role: z.string().optional(),
    employeeId: z.string().optional(),
    dateOfBirth: z
      .string({ required_error: "Date of birth is required" })
      .refine((val) => !Number.isNaN(Date.parse(val)), "Enter a valid date")
      .refine((val) => {
        const dob = new Date(val);
        const age = (Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
        return age >= 16 && age <= 100;
      }, "You must be between 16 and 100 years old"),
    password: passwordField,
    confirmPassword: z.string({ required_error: "Please confirm your password" }),
    agreeToTerms: z.literal(true, {
      errorMap: () => ({ message: "You must agree to the Terms & Conditions and Privacy Policy" }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .superRefine((data, ctx) => {
    // Validate the phone number against the selected country's real numbering plan
    const isValid = isValidPhoneNumber(data.phoneNumber, data.countryCode as never);
    if (!isValid) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Enter a valid mobile number for the selected country`,
        path: ["phoneNumber"],
      });
    }
  });

export const loginSchema = z.object({
  email: z.string({ required_error: "Email address is required" }).trim().toLowerCase().email("Enter a valid email address"),
  password: z.string({ required_error: "Password is required" }).min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string({ required_error: "Email address is required" }).trim().toLowerCase().email("Enter a valid email address"),
});

export const resetPasswordSchema = z
  .object({
    password: passwordField,
    confirmPassword: z.string({ required_error: "Please confirm your password" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const updateProfileSchema = z.object({
  firstName: nameField("First name").optional(),
  lastName: nameField("Last name").optional(),
  department: z.string().optional(),
  role: z.string().optional(),
  employeeId: z.string().optional(),
  dateOfBirth: z.string().optional(),
  countryCode: z
    .string()
    .refine((val) => validCountryCodes.includes(val as never), "Select a valid country")
    .optional(),
  phoneNumber: z.string().trim().optional(),
}).superRefine((data, ctx) => {
  if (data.phoneNumber && data.countryCode) {
    const isValid = isValidPhoneNumber(data.phoneNumber, data.countryCode as never);
    if (!isValid) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter a valid mobile number for the selected country",
        path: ["phoneNumber"],
      });
    }
  }
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string({ required_error: "Current password is required" }).min(1),
    newPassword: passwordField,
    confirmNewPassword: z.string({ required_error: "Please confirm your new password" }),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Passwords do not match",
    path: ["confirmNewPassword"],
  });
