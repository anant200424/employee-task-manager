import mongoose, { Document, Model, Schema } from "mongoose";

export interface ITask extends Document {
  title: string;
  description?: string;
  status: "todo" | "in_progress" | "review" | "completed";
  priority: "low" | "medium" | "high" | "urgent";
  dueDate?: Date;
  assignedTo?: mongoose.Types.ObjectId;
  department?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<ITask>(
  {
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
      maxlength: [500, "Description cannot exceed 500 characters"],
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
    assignedTo: {
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
  },
  { timestamps: true }
);

const Task: Model<ITask> = mongoose.models.Task || mongoose.model<ITask>("Task", taskSchema);

export default Task;
