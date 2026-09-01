export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  countryCode: string;
  dialCode: string;
  phoneNumber: string;
  dateOfBirth?: string;
  department?: string;
  role: string;
  employeeId?: string;
  isEmailVerified: boolean;
  avatarUrl?: string;
  coverUrl?: string;
  employmentInfo?: {
    joiningDate?: string;
    workLocation?: string;
    employmentType?: string;
    manager?: string;
  };
  compliance?: {
    panNumber?: string;
    aadharNumber?: string;
    uanNumber?: string;
    taxRegime?: "old" | "new";
  };
  documents?: {
    _id?: string;
    title: string;
    url: string;
    type: string;
    uploadedAt: string;
  }[];
  salary?: {
    basic: number;
    hra: number;
    allowances: number;
    pf: number;
    totalCTC: number;
  };
  privacySettings?: {
    dataSharingConsent: boolean;
    marketingEmails: boolean;
  };
  notificationPreferences?: {
    emailAlerts: boolean;
    pushNotifications: boolean;
    weeklyDigest: boolean;
    theme: "light" | "dark" | "system";
  };
  createdAt: string;
}

export interface Task {
  _id: string;
  title: string;
  description?: string;
  status: "todo" | "in_progress" | "review" | "completed";
  priority: "low" | "medium" | "high" | "urgent";
  dueDate?: string;
  assignedTo?: string;
  department?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface RegisterFormData {
  firstName: string;
  lastName: string;
  email: string;
  countryCode: string;
  phoneNumber: string;
  department: string;
  role: string;
  password: string;
  confirmPassword: string;
  employeeId: string;
  dateOfBirth: string;
  agreeToTerms: boolean;
}

export interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface ForgotPasswordFormData {
  email: string;
}

export interface ResetPasswordFormData {
  password: string;
  confirmPassword: string;
}

export type FormErrors<T> = Partial<Record<keyof T, string>>;

export interface ApiSuccessResponse<T> {
  success: true;
  message: string;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string>;
}
