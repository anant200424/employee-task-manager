import mongoose, { Document, Model, Schema } from "mongoose";

export interface IAuditLog extends Document {
  actorId?: mongoose.Types.ObjectId;
  actorName: string;
  actorEmail: string;
  actorRole: string;
  action: string;
  resourceType: "user" | "task" | "auth" | "system" | "security" | "department" | "team";
  resourceId?: string;
  details?: Record<string, unknown> | string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    actorId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    actorName: { type: String, default: "System", trim: true },
    actorEmail: { type: String, default: "", trim: true, lowercase: true },
    actorRole: { type: String, default: "system", index: true },
    action: { type: String, required: true, index: true },
    resourceType: {
      type: String,
      enum: ["user", "task", "auth", "system", "security", "department", "team"],
      required: true,
      index: true,
    },
    resourceId: { type: String, index: true },
    details: { type: Schema.Types.Mixed },
    ipAddress: { type: String, default: "" },
    userAgent: { type: String, default: "" },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false }
);

// Compound indexes for audit log chronological filtering and querying
auditLogSchema.index({ timestamp: -1, resourceType: 1 });
auditLogSchema.index({ timestamp: -1, action: 1 });
auditLogSchema.index({ actorEmail: 1, timestamp: -1 });

const AuditLog: Model<IAuditLog> =
  mongoose.models.AuditLog || mongoose.model<IAuditLog>("AuditLog", auditLogSchema);

export default AuditLog;
