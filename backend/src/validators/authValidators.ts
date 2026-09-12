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

export const verifyResetOtpSchema = z.object({
  email: z
    .string({ required_error: "Email address is required" })
    .trim()
    .toLowerCase()
    .email("Enter a valid email address"),
  otp: z
    .string({ required_error: "Verification code is required" })
    .length(6, "Verification code must be exactly 6 digits")
    .regex(/^\d{6}$/, "Verification code must contain numbers only"),
});

export const resetPasswordSchema = z
  .object({
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email("Enter a valid email address")
      .optional(),
    otp: z
      .string()
      .length(6, "Verification code must be exactly 6 digits")
      .regex(/^\d{6}$/, "Verification code must contain numbers only")
      .optional(),
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
    department: z
      .string()
      .min(2, "Department must be at least 2 characters")
      .max(50, "Department cannot exceed 50 characters")
      .optional(),
    role: z
      .string()
      .min(2, "Role title must be at least 2 characters")
      .max(60, "Role title cannot exceed 60 characters")
      .optional(),
    employeeId: z
      .string()
      .min(3, "Employee ID must be at least 3 characters")
      .max(25, "Employee ID cannot exceed 25 characters")
      .regex(/^[A-Za-z0-9-_]+$/, "Employee ID can only contain letters, numbers, hyphens and underscores")
      .optional(),
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
    employmentInfo: z
      .object({
        joiningDate: z.string().optional(),
        workLocation: z.string().optional(),
        employmentType: z.string().optional(),
        manager: z
          .string()
          .max(60, "Manager name cannot exceed 60 characters")
          .optional(),
        designation: z
          .string()
          .max(60, "Designation cannot exceed 60 characters")
          .optional(),
      })
      .optional(),
    compliance: z
      .object({
        panNumber: z
          .string()
          .refine(
            (val) => !val || /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(val.trim().toUpperCase()),
            "Invalid PAN format (e.g. ABCDE1234F)",
          )
          .optional(),
        aadharNumber: z
          .string()
          .refine(
            (val) => !val || /^[0-9]{12}$/.test(val.trim().replace(/\s+/g, "")),
            "Invalid Aadhaar format (must be 12 digits)",
          )
          .optional(),
        uanNumber: z
          .string()
          .refine(
            (val) => !val || /^[0-9]{12}$/.test(val.trim().replace(/\s+/g, "")),
            "Invalid UAN format (must be 12 digits)",
          )
          .optional(),
        taxRegime: z.enum(["old", "new"]).optional(),
      })
      .optional(),
    documents: z
      .array(
        z.object({
          _id: z.string().optional(),
          title: z.string(),
          url: z.string(),
          type: z.string(),
        }),
      )
      .optional(),
    salary: z
      .object({
        basic: z.number().min(0, "Basic salary cannot be negative").optional(),
        hra: z.number().min(0, "HRA cannot be negative").optional(),
        allowances: z.number().min(0, "Allowances cannot be negative").optional(),
        pf: z.number().min(0, "PF cannot be negative").optional(),
        totalCTC: z.number().min(0, "Total CTC cannot be negative").optional(),
      })
      .optional(),
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
    regionalPreferences: z.object({
      language: z.string().optional(),
      timezone: z.string().optional(),
      dateFormat: z.string().optional(),
      firstDayOfWeek: z.string().optional(),
    }).optional(),
    appearancePreferences: z.object({
      density: z.string().optional(),
      accentColor: z.string().optional(),
      sidebarBehavior: z.string().optional(),
    }).optional(),
    twoFactorEnabled: z.boolean().optional(),
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
    }).min(1, "Current password is required"),
    newPassword: passwordField,
    confirmPassword: z.string().optional(),
    confirmNewPassword: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const confirmation = data.confirmPassword || data.confirmNewPassword;
    if (!confirmation) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please confirm your new password",
        path: ["confirmPassword"],
      });
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please confirm your new password",
        path: ["confirmNewPassword"],
      });
    } else if (data.newPassword !== confirmation) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Passwords do not match",
        path: ["confirmPassword"],
      });
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Passwords do not match",
        path: ["confirmNewPassword"],
      });
    }

    if (data.currentPassword && data.newPassword && data.currentPassword === data.newPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "New password must be different from current password",
        path: ["newPassword"],
      });
    }
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
