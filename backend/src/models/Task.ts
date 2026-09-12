import mongoose, { Document, Model, Schema } from "mongoose";

export interface ITaskComment {
  _id?: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  authorName: string;
  authorAvatar?: string;
  text: string;
  createdAt: Date;
}

export interface ITaskChecklistItem {
  _id?: mongoose.Types.ObjectId;
  title: string;
  completed: boolean;
  completedAt?: Date;
  completedBy?: mongoose.Types.ObjectId;
}

export interface ITaskActivity {
  _id?: mongoose.Types.ObjectId;
  action: string;
  performedBy?: mongoose.Types.ObjectId;
  performerName?: string;
  timestamp: Date;
  details?: string;
}

export interface ITask extends Document {
  taskCode: string;
  title: string;
  description?: string;
  status: "todo" | "in_progress" | "review" | "completed";
  priority: "low" | "medium" | "high" | "urgent";
  dueDate?: Date;
  assignedTo: mongoose.Types.ObjectId[];
  createdBy?: mongoose.Types.ObjectId;
  department?: string;
  tags: string[];
  isDeleted?: boolean;
  deletedAt?: Date;
  deletedBy?: mongoose.Types.ObjectId;
  comments: ITaskComment[];
  checklist: ITaskChecklistItem[];
  activityLog: ITaskActivity[];
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<ITask>(
  {
    taskCode: {
      type: String,
      required: [true, "Task code is required"],
      trim: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, "Task title is required"],
      trim: true,
      minlength: [2, "Title must be at least 2 characters"],
      maxlength: [120, "Title cannot exceed 120 characters"],
    },
    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: [3000, "Description cannot exceed 3,000 characters"],
    },
    status: {
      type: String,
      enum: ["todo", "in_progress", "review", "completed"],
      default: "in_progress",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    dueDate: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default 7 days from now
    },
    assignedTo: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        index: true,
      },
    ],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    department: {
      type: String,
      default: "Engineering",
      trim: true,
    },
    tags: {
      type: [String],
      default: [],
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
    comments: [
      {
        user: { type: Schema.Types.ObjectId, ref: "User", required: true },
        authorName: { type: String, required: true },
        authorAvatar: { type: String, default: "" },
        text: { type: String, required: true, trim: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    checklist: [
      {
        title: { type: String, required: true, trim: true },
        completed: { type: Boolean, default: false },
        completedAt: { type: Date },
        completedBy: { type: Schema.Types.ObjectId, ref: "User" },
      },
    ],
    activityLog: [
      {
        action: { type: String, required: true },
        performedBy: { type: Schema.Types.ObjectId, ref: "User" },
        performerName: { type: String, default: "User" },
        timestamp: { type: Date, default: Date.now },
        details: { type: String, default: "" },
      },
    ],
  },
  { timestamps: true },
);

const Task: Model<ITask> =
  mongoose.models.Task || mongoose.model<ITask>("Task", taskSchema);

export default Task;
