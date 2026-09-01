import request from "supertest";
import mongoose from "mongoose";
import "dotenv/config";
import app from "./src/app";
import User from "./src/models/User";
import jwt from "jsonwebtoken";

async function run() {
  await mongoose.connect(process.env.MONGO_URI as string);
  console.log("Connected to DB");

  const user = await User.findOne();
  if (!user) return console.log("No user");

  const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_ACCESS_SECRET as string);

  console.log("Fetching tasks...");
  const res = await request(app)
    .get("/api/tasks")
    .set("Authorization", `Bearer ${token}`);

  console.log("Status:", res.status);
  console.log("Tasks returned:", res.body.data.tasks.length);

  await mongoose.disconnect();
}

run().catch(console.error);
