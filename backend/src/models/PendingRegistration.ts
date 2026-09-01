import mongoose, { Document, Model, Schema } from "mongoose";

export interface IPendingRegistration extends Document {
  firstName: string;
  lastName: string;
  email: string;
  countryCode: string;
  dialCode: string;
  phoneNumber: string;
  department?: string;
  role?: string;
  employeeId?: string;
  dateOfBirth: Date;
  passwordHash: string;
  avatarUrl?: string;
  coverUrl?: string;
  verificationToken: string;

  emailOtpHash: string;
  phoneOtpHash?: string;
  emailOtpAttempts: number;
  phoneOtpAttempts: number;
  emailOtpExpires: Date;
  phoneOtpExpires?: Date;

  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isDraftAllowed: boolean;

  createdAt: Date;
}

const pendingRegistrationSchema = new Schema<IPendingRegistration>(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    countryCode: { type: String, required: true },
    dialCode: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    department: { type: String },
    role: { type: String },
    employeeId: { type: String },
    dateOfBirth: { type: Date, required: true },
    passwordHash: { type: String, required: true },
    avatarUrl: { type: String, default: "" },
    coverUrl: { type: String, default: "" },
    verificationToken: { type: String, required: true },

    emailOtpHash: { type: String, required: true },
    phoneOtpHash: { type: String },
    emailOtpAttempts: { type: Number, default: 0 },
    phoneOtpAttempts: { type: Number, default: 0 },
    emailOtpExpires: { type: Date, required: true },
    phoneOtpExpires: { type: Date },

    isEmailVerified: { type: Boolean, default: false },
    isPhoneVerified: { type: Boolean, default: false },
    isDraftAllowed: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// TTL Index: Automatically delete document after 24 hours
// Registration sessions (drafts) are valid for 24 hours max.
pendingRegistrationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });
// Unique index on email so a user can only have one pending registration at a time
pendingRegistrationSchema.index({ email: 1 }, { unique: true });

const PendingRegistration: Model<IPendingRegistration> =
  mongoose.model<IPendingRegistration>(
    "PendingRegistration",
    pendingRegistrationSchema,
  );
export default PendingRegistration;
