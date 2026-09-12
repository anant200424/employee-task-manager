import { z } from "zod";

export const createTaskSchema = z.object({
  title: z
    .string({ required_error: "Task title is required" })
    .trim()
    .min(3, "Task title must be at least 3 characters")
    .max(120, "Task title cannot exceed 120 characters"),
  description: z.string().max(3000, "Description cannot exceed 3,000 characters").optional(),
  status: z.enum(["todo", "in_progress", "review", "completed"]).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  dueDate: z
    .string()
    .optional()
    .refine(
      (val) => !val || !Number.isNaN(Date.parse(val)),
      "Due date must be a valid ISO date"
    ),
  department: z.string().trim().max(50).optional(),
  tags: z.union([z.array(z.string()), z.string()]).optional(),
  assignedTo: z
    .union([z.array(z.string()), z.string()])
    .optional(),
});

export const updateTaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Task title must be at least 3 characters")
    .max(120, "Task title cannot exceed 120 characters")
    .optional(),
  description: z.string().max(3000, "Description cannot exceed 3,000 characters").optional(),
  status: z.enum(["todo", "in_progress", "review", "completed"]).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  dueDate: z
    .string()
    .optional()
    .refine(
      (val) => !val || !Number.isNaN(Date.parse(val)),
      "Due date must be a valid ISO date"
    ),
  department: z.string().trim().max(50).optional(),
  tags: z.union([z.array(z.string()), z.string()]).optional(),
  assignedTo: z.union([z.array(z.string()), z.string()]).optional(),
});

export const addCommentSchema = z.object({
  text: z
    .string({ required_error: "Comment text is required" })
    .trim()
    .min(1, "Comment cannot be empty")
    .max(2000, "Comment cannot exceed 2,000 characters"),
});

export const addChecklistSchema = z.object({
  title: z
    .string({ required_error: "Checklist item title is required" })
    .trim()
    .min(1, "Title cannot be empty")
    .max(200, "Title cannot exceed 200 characters"),
});
