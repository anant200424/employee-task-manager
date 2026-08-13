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
  loginAttempts: number;
  lockUntil?: Date;
  passwordChangedAt?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  refreshTokens: string[];
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