import mongoose from "mongoose";
import dotenv from "dotenv";
import Task from "./src/models/Task";

dotenv.config();

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI as string);
    console.log("Connected to MongoDB");

    const task = await Task.create({
      title: "Test task manually",
      description: "Testing",
      status: "in_progress",
      priority: "medium",
      dueDate: new Date(),
      department: "Engineering",
      tags: ["Test"],
    });

    console.log("Task created:", task);
  } catch (err) {
    console.error("Error creating task:", err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
