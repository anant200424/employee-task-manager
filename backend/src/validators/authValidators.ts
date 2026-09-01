import { z } from "zod";
import { isValidPhoneNumber, getCountries } from "libphonenumber-js";

const validCountryCodes = getCountries();

const nameField = (label: string) =>
  z
    .string({ required_error: `${label} is required` })
    .trim()
    .min(2, `${label} must be at least 2 characters`)
    .max(40, `${label} cannot exceed 40 characters`)
    .regex(
      /^[A-Za-z\s'-]+$/,
      `${label} can only contain letters, spaces, hyphens or apostrophes`,
    );

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
    email: z
      .string({ required_error: "Email address is required" })
      .trim()
      .toLowerCase()
      .email("Enter a valid email address"),
    countryCode: z
      .string({ required_error: "Country is required" })
      .refine(
        (val) => validCountryCodes.includes(val as never),
        "Select a valid country",
      ),
    phoneNumber: z
      .string({ required_error: "Mobile number is required" })
      .trim(),
    department: z.string().optional(),
    role: z.string().optional(),
    employeeId: z.string().optional(),
    dateOfBirth: z
      .string({ required_error: "Date of birth is required" })
      .refine((val) => !Number.isNaN(Date.parse(val)), "Enter a valid date")
      .refine((val) => {
        const dob = new Date(val);
        const age =
          (Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
        return age >= 16 && age <= 100;
      }, "You must be between 16 and 100 years old"),
    password: passwordField,
    confirmPassword: z.string({
      required_error: "Please confirm your password",
    }),
    avatarUrl: z.string().optional(),
    coverUrl: z.string().optional(),
    agreeToTerms: z.literal(true, {
      errorMap: () => ({
        message: "You must agree to the Terms & Conditions and Privacy Policy",
      }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .superRefine((data, ctx) => {
    // Validate the phone number against the selected country's real numbering plan
    const isValid = isValidPhoneNumber(
      data.phoneNumber,
      data.countryCode as never,
    );
    if (!isValid) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Enter a valid mobile number for the selected country`,
        path: ["phoneNumber"],
      });
    }
  });

export const loginSchema = z.object({
  email: z
    .string({ required_error: "Email address is required" })
    .trim()
    .toLowerCase()
    .email("Enter a valid email address"),
  password: z
    .string({ required_error: "Password is required" })
    .min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
});

export const forgotPasswordSchema = z.object({
  email: z
    .string({ required_error: "Email address is required" })
    .trim()
    .toLowerCase()
    .email("Enter a valid email address"),
});

export const resetPasswordSchema = z
  .object({
    password: passwordField,
    confirmPassword: z.string({
      required_error: "Please confirm your password",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const updateProfileSchema = z
  .object({
    firstName: nameField("First name").optional(),
    lastName: nameField("Last name").optional(),
    department: z.string().optional(),
    role: z.string().optional(),
    employeeId: z.string().optional(),
    dateOfBirth: z.string().optional(),
    countryCode: z
      .string()
      .refine(
        (val) => validCountryCodes.includes(val as never),
        "Select a valid country",
      )
      .optional(),
    phoneNumber: z.string().trim().optional(),
    avatarUrl: z.string().optional(),
    coverUrl: z.string().optional(),
    employmentInfo: z.object({
      joiningDate: z.string().optional(),
      workLocation: z.string().optional(),
      employmentType: z.string().optional(),
      manager: z.string().optional(),
    }).optional(),
    compliance: z.object({
      panNumber: z.string().optional(),
      aadharNumber: z.string().optional(),
      uanNumber: z.string().optional(),
      taxRegime: z.enum(["old", "new"]).optional(),
    }).optional(),
    documents: z.array(z.object({
      _id: z.string().optional(),
      title: z.string(),
      url: z.string(),
      type: z.string(),
    })).optional(),
    salary: z.object({
      basic: z.number().optional(),
      hra: z.number().optional(),
      allowances: z.number().optional(),
      pf: z.number().optional(),
      totalCTC: z.number().optional(),
    }).optional(),
    privacySettings: z.object({
      dataSharingConsent: z.boolean().optional(),
      marketingEmails: z.boolean().optional(),
    }).optional(),
    notificationPreferences: z.object({
      emailAlerts: z.boolean().optional(),
      pushNotifications: z.boolean().optional(),
      weeklyDigest: z.boolean().optional(),
      theme: z.enum(["light", "dark", "system"]).optional(),
    }).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.phoneNumber && data.countryCode) {
      const isValid = isValidPhoneNumber(
        data.phoneNumber,
        data.countryCode as never,
      );
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
    currentPassword: z.string({
      required_error: "Current password is required",
    }),
    newPassword: passwordField,
    confirmPassword: z.string({
      required_error: "Please confirm your new password",
    }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const verifyOtpSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .trim()
    .toLowerCase()
    .email(),
  emailOtp: z
    .string({ required_error: "Email OTP is required" })
    .length(6, "OTP must be 6 digits"),
  phoneOtp: z
    .string({ required_error: "Phone OTP is required" })
    .length(6, "OTP must be 6 digits"),
});

export const resendOtpSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .trim()
    .toLowerCase()
    .email(),
});
