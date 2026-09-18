import mongoose, { Document, Model, Schema } from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { uploadImageToCloudinary } from "../config/cloudinary";

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  countryCode: string; // e.g. "IN"
  dialCode: string; // e.g. "+91"
  phoneNumber: string; // national significant number, digits only
  department: string; // e.g. "Engineering"
  role: string; // e.g. "Software Engineer" or "admin"
  systemRole?: "super_admin" | "system_admin" | "admin" | "manager" | "employee";
  employeeId: string; // e.g. "EMP-1042"
  dateOfBirth: Date;
  password: string;
  isEmailVerified: boolean;
  avatarUrl?: string;
  coverUrl?: string;
  loginAttempts: number;
  lockUntil?: Date;
  passwordChangedAt?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  refreshTokens: string[];
  isBlocked?: boolean;
  blockedAt?: Date;
  blockedReason?: string;
  isDeleted?: boolean;
  deletedAt?: Date;
  deletedBy?: mongoose.Types.ObjectId;

  // HR Fields
  employmentInfo?: {
    joiningDate?: Date;
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
    _id?: mongoose.Types.ObjectId;
    title: string;
    url: string;
    type: string;
    uploadedAt: Date;
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

  // Sensitive change verification OTPs
  changeEmailOtpHash?: string;
  changeEmailOtpExpires?: Date;
  pendingNewEmail?: string;

  changePhoneOtpHash?: string;
  changePhoneOtpExpires?: Date;
  pendingNewCountryCode?: string;
  pendingNewDialCode?: string;
  pendingNewPhone?: string;

  createdAt: Date;
  updatedAt: Date;

  comparePassword(candidate: string): Promise<boolean>;
  createPasswordResetToken(): string;
  isLocked: boolean;
}

const userSchema = new Schema<IUser>(
  {
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      minlength: [2, "First name must be at least 2 characters"],
      maxlength: [40, "First name cannot exceed 40 characters"],
      match: [
        /^[A-Za-z\s'-]+$/,
        "First name can only contain letters, spaces, hyphens or apostrophes",
      ],
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      minlength: [1, "Last name must be at least 1 character"],
      maxlength: [40, "Last name cannot exceed 40 characters"],
      match: [
        /^[A-Za-z\s'-]+$/,
        "Last name can only contain letters, spaces, hyphens or apostrophes",
      ],
    },
    email: {
      type: String,
      required: [true, "Email address is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Enter a valid email address"],
    },
    countryCode: {
      type: String,
      required: [true, "Country is required"],
      uppercase: true,
    },
    dialCode: {
      type: String,
      required: [true, "Dial code is required"],
    },
    phoneNumber: {
      type: String,
      required: [true, "Mobile number is required"],
    },
    department: {
      type: String,
      default: "Engineering",
      trim: true,
    },
    role: {
      type: String,
      default: "Software Engineer",
      trim: true,
    },
    systemRole: {
      type: String,
      enum: ["super_admin", "system_admin", "admin", "manager", "employee"],
      default: "employee",
      index: true,
    },
    employeeId: {
      type: String,
      default: function () {
        return `EMP-${Math.floor(1000 + Math.random() * 9000)}`;
      },
      trim: true,
      uppercase: true,
    },
    dateOfBirth: {
      type: Date,
      required: [true, "Date of birth is required"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    avatarUrl: {
      type: String,
      trim: true,
      default: "",
    },
    coverUrl: {
      type: String,
      trim: true,
      default: "",
    },
    loginAttempts: {
      type: Number,
      default: 0,
      select: false,
    },
    lockUntil: {
      type: Date,
      select: false,
    },
    passwordChangedAt: {
      type: Date,
      select: false,
    },
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
    refreshTokens: {
      type: [String],
      default: [],
      select: false,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    blockedAt: {
      type: Date,
    },
    blockedReason: {
      type: String,
      trim: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
    },
    deletedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    employmentInfo: {
      joiningDate: { type: Date },
      workLocation: { type: String, default: "Office" },
      employmentType: { type: String, default: "Full-Time" },
      manager: { type: String },
      designation: { type: String, trim: true },
    },
    compliance: {
      panNumber: { type: String, uppercase: true },
      aadharNumber: { type: String },
      uanNumber: { type: String },
      taxRegime: { type: String, enum: ["old", "new"] },
    },
    documents: [
      {
        title: { type: String, required: true },
        url: { type: String, required: true },
        type: { type: String, required: true },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    salary: {
      basic: { type: Number, default: 0 },
      hra: { type: Number, default: 0 },
      allowances: { type: Number, default: 0 },
      pf: { type: Number, default: 0 },
      totalCTC: { type: Number, default: 0 },
    },
    privacySettings: {
      dataSharingConsent: { type: Boolean, default: false },
      marketingEmails: { type: Boolean, default: false },
    },
    notificationPreferences: {
      emailAlerts: { type: Boolean, default: true },
      pushNotifications: { type: Boolean, default: true },
      weeklyDigest: { type: Boolean, default: true },
      theme: { type: String, enum: ["light", "dark", "system"], default: "system" },
    },
    regionalPreferences: {
      language: { type: String, default: "English" },
      timezone: { type: String, default: "UTC-05:00 Eastern Time (US)" },
      dateFormat: { type: String, default: "MM/DD/YYYY" },
      firstDayOfWeek: { type: String, default: "Sunday" },
    },
    appearancePreferences: {
      density: { type: String, default: "Comfortable" },
      accentColor: { type: String, default: "Indigo" },
      sidebarBehavior: { type: String, default: "Expanded" },
    },
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },

    // Profile credential change OTPs (never expose in normal responses)
    changeEmailOtpHash: { type: String, select: false },
    changeEmailOtpExpires: { type: Date, select: false },
    pendingNewEmail: { type: String, lowercase: true, trim: true },

    changePhoneOtpHash: { type: String, select: false },
    changePhoneOtpExpires: { type: Date, select: false },
    pendingNewCountryCode: { type: String },
    pendingNewDialCode: { type: String },
    pendingNewPhone: { type: String, trim: true },
  },
  { timestamps: true },
);

// Virtual: is the account currently locked out due to brute-force attempts
userSchema.virtual("isLocked").get(function (this: IUser) {
  return !!(this.lockUntil && this.lockUntil.getTime() > Date.now());
});

// Pre-save hook: hash password and optimize base64 images to static files
userSchema.pre("save", async function (next) {
  if (this.isModified("avatarUrl") && this.avatarUrl && this.avatarUrl.startsWith("data:image/")) {
    const res = await uploadImageToCloudinary(this.avatarUrl, "empsphere/avatars", `avatar-${this.id}`);
    this.avatarUrl = res.url;
  }
  if (this.isModified("coverUrl") && this.coverUrl && this.coverUrl.startsWith("data:image/")) {
    const res = await uploadImageToCloudinary(this.coverUrl, "empsphere/covers", `cover-${this.id}`);
    this.coverUrl = res.url;
  }

  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  if (!this.isNew) {
    this.passwordChangedAt = new Date(Date.now() - 1000);
  }
  next();
});

userSchema.methods.comparePassword = async function (
  candidate: string,
): Promise<boolean> {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.createPasswordResetToken = function (): string {
  const resetToken = crypto.randomBytes(32).toString("hex");
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  const expiresMin = Number(process.env.RESET_TOKEN_EXPIRES_MIN || 30);
  this.passwordResetExpires = new Date(Date.now() + expiresMin * 60 * 1000);
  return resetToken;
};

// Never leak sensitive fields when the document is serialized
userSchema.set("toJSON", {
  transform: (_doc, ret) => {
    const obj = ret as unknown as Record<string, unknown>;
    delete obj.password;
    delete obj.loginAttempts;
    delete obj.lockUntil;
    delete obj.passwordResetToken;
    delete obj.passwordResetExpires;
    delete obj.refreshTokens;
    delete obj.changeEmailOtpHash;
    delete obj.changeEmailOtpExpires;
    delete obj.changePhoneOtpHash;
    delete obj.changePhoneOtpExpires;
    delete obj.pendingNewEmail;
    delete obj.pendingNewPhone;
    delete obj.__v;
    return obj;
  },
});

// High-performance compound indexes for directory listing, role filtering, and status checks
userSchema.index({ isDeleted: 1, createdAt: -1 });
userSchema.index({ isDeleted: 1, department: 1 });
userSchema.index({ isDeleted: 1, systemRole: 1 });
userSchema.index({ isDeleted: 1, isBlocked: 1 });

const User: Model<IUser> = mongoose.model<IUser>("User", userSchema);
export default User;
