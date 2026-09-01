import request from "supertest";
import mongoose from "mongoose";
import "dotenv/config";
import app from "./src/app";
import User from "./src/models/User";
import jwt from "jsonwebtoken";

async function run() {
  await mongoose.connect(process.env.MONGO_URI as string);
  console.log("Connected to DB");

  // Create or get a user to mock auth
  let user = await User.findOne();
  if (!user) {
    user = await User.create({
      firstName: "Test",
      lastName: "User",
      email: "test@example.com",
      countryCode: "US",
      dialCode: "+1",
      phoneNumber: "1234567890",
      dateOfBirth: new Date(),
      password: "password123",
    });
  }

  const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_ACCESS_SECRET as string);

  console.log("Sending request...");
  const res = await request(app)
    .post("/api/tasks")
    .set("Authorization", `Bearer ${token}`)
    .send({
      title: "Test Task",
      description: "",
      priority: "medium",
      status: "in_progress",
      tags: []
    });

  console.log("Status:", res.status);
  console.log("Body:", res.body);

  await mongoose.disconnect();
}

run().catch(console.error);
