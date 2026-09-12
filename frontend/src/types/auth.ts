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
  systemRole?: "super_admin" | "system_admin" | "admin" | "manager" | "employee";
  employeeId?: string;
  isEmailVerified: boolean;
  avatarUrl?: string;
  coverUrl?: string;
  isBlocked?: boolean;
  isDeleted?: boolean;
  blockedAt?: string;
  blockedReason?: string;
  employmentInfo?: {
    joiningDate?: string;
    workLocation?: string;
    employmentType?: string;
    manager?: string;
    designation?: string;
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
  regionalPreferences?: {
    language: string;
    timezone: string;
    dateFormat: string;
    firstDayOfWeek: string;
  };
  appearancePreferences?: {
    density: string;
    accentColor: string;
    sidebarBehavior: string;
  };
  twoFactorEnabled?: boolean;
  createdAt: string;
}

export interface AssignedUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string;
  department?: string;
  role?: string;
  systemRole?: string;
  employeeId?: string;
}

export interface TaskComment {
  _id?: string;
  user?: {
    _id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  } | string;
  authorName: string;
  authorAvatar?: string;
  text: string;
  createdAt: string;
}

export interface TaskChecklistItem {
  _id?: string;
  title: string;
  completed: boolean;
  completedAt?: string;
  completedBy?: string;
}

export interface TaskActivity {
  _id?: string;
  action: string;
  performedBy?: string;
  performerName?: string;
  timestamp: string;
  details?: string;
}

export interface Task {
  _id: string;
  taskCode: string;
  title: string;
  description?: string;
  status: "todo" | "in_progress" | "review" | "completed";
  priority: "low" | "medium" | "high" | "urgent";
  dueDate?: string;
  assignedTo?: (AssignedUser | string)[];
  createdBy?: {
    _id?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    role?: string;
  } | string;
  department?: string;
  tags?: string[];
  isDeleted?: boolean;
  deletedAt?: string;
  comments?: TaskComment[];
  checklist?: TaskChecklistItem[];
  activityLog?: TaskActivity[];
  createdAt: string;
  updatedAt: string;
}

export interface AuditLogItem {
  _id: string;
  actorId?: string;
  actorName: string;
  actorEmail: string;
  actorRole: string;
  action: string;
  resourceType: "user" | "task" | "auth" | "system" | "security" | "department" | "team";
  resourceId?: string;
  details?: Record<string, unknown> | string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

export interface AuditLogPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface NotificationItem {
  _id: string;
  recipient: string;
  sender?: string;
  senderName?: string;
  title: string;
  message: string;
  type: "task" | "finance" | "event" | "alert" | "system";
  task?: string;
  taskCode?: string;
  read: boolean;
  createdAt: string;
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
  avatarUrl?: string;
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
