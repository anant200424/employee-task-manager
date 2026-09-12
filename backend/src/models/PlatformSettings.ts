import mongoose, { Document, Schema } from "mongoose";

export interface IPlatformSettings extends Document {
  publicRegistration: boolean;
  maintenanceMode: boolean;
  sessionTimeoutMinutes: number;
  maxLoginAttempts: number;
  companyName: string;
  defaultTimezone: string;
}

const platformSettingsSchema = new Schema<IPlatformSettings>(
  {
    publicRegistration: { type: Boolean, default: true },
    maintenanceMode: { type: Boolean, default: false },
    sessionTimeoutMinutes: { type: Number, default: 60 },
    maxLoginAttempts: { type: Number, default: 5 },
    companyName: { type: String, default: "EmpSphere Global" },
    defaultTimezone: { type: String, default: "UTC-05:00 Eastern Time (US)" },
  },
  { timestamps: true }
);

const PlatformSettings =
  mongoose.models.PlatformSettings ||
  mongoose.model<IPlatformSettings>("PlatformSettings", platformSettingsSchema);

export default PlatformSettings;
