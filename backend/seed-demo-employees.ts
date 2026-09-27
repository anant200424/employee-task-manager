
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import User from "./models/User";

dotenv.config({ path: path.join(__dirname, "../.env") });

const departments = [
  "Engineering",
  "Human Resources",
  "Finance",
  "Marketing",
  "Sales",
  "Operations",
  "IT & Security",
];

const firstNames = [
  "Aarav", "Vivaan", "Aditya", "Arjun", "Rahul",
  "Rohan", "Karan", "Amit", "Neha", "Priya",
  "Ananya", "Sneha", "Pooja", "Ishita", "Kavya",
  "Riya", "Meera", "Simran", "Nikhil", "Vikram",
];

const lastNames = [
  "Sharma", "Verma", "Singh", "Kumar", "Gupta",
  "Patel", "Mehta", "Das", "Reddy", "Jain",
];

async function seedEmployees() {
  const uri = process.env.MONGO_URI;
  const password = process.env.DEMO_EMPLOYEE_PASSWORD;

  if (!uri || !password || password.length < 8) {
    throw new Error(
      "Set MONGO_URI and DEMO_EMPLOYEE_PASSWORD in Render."
    );
  }

  await mongoose.connect(uri);
  console.log("MongoDB connected.");

  let created = 0;
  let skipped = 0;

  try {
    for (let i = 1; i <= 100; i++) {
      const number = String(i).padStart(3, "0");
      const email = `demo.employee${number}@empsphere.io`;

      const existing = await User.findOne({ email });

      if (existing) {
        skipped++;
        continue;
      }

      await User.create({
        firstName: firstNames[(i - 1) % firstNames.length],
        lastName: lastNames[
          Math.floor((i - 1) / firstNames.length) %
          lastNames.length
        ],
        email,
        password,
        systemRole: "employee",
        role: "Software Engineer",
        department: departments[(i - 1) % departments.length],
        employeeId: `DEMO-${number}`,
        dateOfBirth: new Date(
          1990 + (i % 10),
          i % 12,
          (i % 27) + 1
        ),
        countryCode: "IN",
        dialCode: "+91",
        phoneNumber: String(9000000000 + i),
        isEmailVerified: true,
        avatarUrl: "",
      });

      created++;
    }

    const demoCount = await User.countDocuments({
      email: /^demo\.employee\d{3}@empsphere\.io$/,
    });

    console.log(`New employees created: ${created}`);
    console.log(`Existing employees skipped: ${skipped}`);
    console.log(`Total demo employees in database: ${demoCount}`);
  } finally {
    await mongoose.disconnect();
  }
}

seedEmployees().catch((error) => {
  console.error("Employee seeding failed:", error.message);
  process.exitCode = 1;
});
