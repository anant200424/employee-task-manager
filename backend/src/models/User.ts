import mongoose, { Document, Model, Schema } from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  countryCode: string; // e.g. "IN"
  dialCode: string; // e.g. "+91"
  phoneNumber: string; // national significant number, digits only
  department: string; // e.g. "Engineering"
  role: string; // e.g. "Software Engineer" or "admin"
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

  // HR Fields
  employmentInfo?: {
    joiningDate?: Date;
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
      match: [/^[A-Za-z\s'-]+$/, "First name can only contain letters, spaces, hyphens or apostrophes"],
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      minlength: [1, "Last name must be at least 1 character"],
      maxlength: [40, "Last name cannot exceed 40 characters"],
      match: [/^[A-Za-z\s'-]+$/, "Last name can only contain letters, spaces, hyphens or apostrophes"],
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
    employmentInfo: {
      joiningDate: { type: Date },
      workLocation: { type: String, default: "Office" },
      employmentType: { type: String, default: "Full-Time" },
      manager: { type: String },
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
  },
  { timestamps: true }
);



// Virtual: is the account currently locked out due to brute-force attempts
userSchema.virtual("isLocked").get(function (this: IUser) {
  return !!(this.lockUntil && this.lockUntil.getTime() > Date.now());
});

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  if (!this.isNew) {
    this.passwordChangedAt = new Date(Date.now() - 1000);
  }
  next();
});

userSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.createPasswordResetToken = function (): string {
  const resetToken = crypto.randomBytes(32).toString("hex");
  this.passwordResetToken = crypto.createHash("sha256").update(resetToken).digest("hex");
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
    delete obj.__v;
    return obj;
  },
});

const User: Model<IUser> = mongoose.model<IUser>("User", userSchema);
export default User;