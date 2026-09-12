import mongoose, { Document, Schema } from "mongoose";

export interface IProject extends Document {
  code: string;
  name: string;
  description?: string;
  department: string;
  priority: "Critical" | "High" | "Medium" | "Low";
  status: "On Track" | "In Execution" | "Delivered" | "Pending";
  targetDate: Date;
  budgetHealth: string;
  manager: mongoose.Types.ObjectId;
  assignedTeam: mongoose.Types.ObjectId[];
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const projectSchema = new Schema<IProject>(
  {
    code: {
      type: String,
      required: [true, "Project code is required"],
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Project name is required"],
      trim: true,
      minlength: [2, "Project name must be at least 2 characters"],
      maxlength: [140, "Project name cannot exceed 140 characters"],
    },
    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: [3000, "Description cannot exceed 3000 characters"],
    },
    department: {
      type: String,
      required: [true, "Department is required"],
      trim: true,
      index: true,
    },
    priority: {
      type: String,
      enum: ["Critical", "High", "Medium", "Low"],
      default: "High",
    },
    status: {
      type: String,
      enum: ["On Track", "In Execution", "Delivered", "Pending"],
      default: "On Track",
    },
    targetDate: {
      type: Date,
      default: () => new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    },
    budgetHealth: {
      type: String,
      default: "On Track",
      trim: true,
    },
    manager: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    assignedTeam: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Project || mongoose.model<IProject>("Project", projectSchema);
