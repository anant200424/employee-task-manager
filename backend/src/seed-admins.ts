/**
 * seed-admins.ts
 * -------------------------------------------------------
 * Creates the 3 privileged admin accounts in MongoDB:
 *   1. super_admin  — full platform access
 *   2. system_admin — security + audit access
 *   3. admin        — user + task management access
 *
 * Run with:  npx ts-node src/seed-admins.ts
 * Safe to run multiple times — skips if account already exists.
 * -------------------------------------------------------
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import User from "./models/User";

dotenv.config({ path: path.join(__dirname, "../.env") });

const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb+srv://anantsingh20334411_db_user:r0JD1tRZayx8aIxP@cluster0.3txsth7.mongodb.net/task_manager";

const adminAccounts = [
  {
    firstName: "Anant",
    lastName: "Singh",
    email: "superadmin@empsphere.io",
    password: "SuperAdmin@123",
    systemRole: "super_admin" as const,
    role: "Super Administrator",
    department: "Executive",
    employeeId: "EMP-0001",
    dateOfBirth: new Date("1990-01-01"),
    countryCode: "IN",
    dialCode: "+91",
    phoneNumber: "9000000001",
    isEmailVerified: true,
    avatarUrl: "",
  },
  {
    firstName: "System",
    lastName: "Admin",
    email: "sysadmin@empsphere.io",
    password: "SystemAdmin@123",
    systemRole: "system_admin" as const,
    role: "System Administrator",
    department: "IT & Security",
    employeeId: "EMP-0002",
    dateOfBirth: new Date("1991-05-15"),
    countryCode: "IN",
    dialCode: "+91",
    phoneNumber: "9000000002",
    isEmailVerified: true,
    avatarUrl: "",
  },
  {
    firstName: "Admin",
    lastName: "User",
    email: "admin@empsphere.io",
    password: "Admin@123456",
    systemRole: "admin" as const,
    role: "admin",
    department: "Administration",
    employeeId: "EMP-0003",
    dateOfBirth: new Date("1992-08-20"),
    countryCode: "IN",
    dialCode: "+91",
    phoneNumber: "9000000003",
    isEmailVerified: true,
    avatarUrl: "",
  },
];

async function seedAdmins() {
  try {
    console.log("\n Connecting to MongoDB Atlas...");
    await mongoose.connect(MONGO_URI);
    console.log("Connected successfully!\n");

    for (const account of adminAccounts) {
      const existing = await User.findOne({ email: account.email }).select("+password");

      if (existing) {
        // Force-fix the password (was double-hashed previously) and patch systemRole
        existing.password = account.password; // plain text — pre-save hook hashes it once
        existing.systemRole = account.systemRole;
        existing.isEmailVerified = true;
        await existing.save({ validateBeforeSave: false });
        console.log(
          `Fixed/Updated [${account.systemRole}]: ${account.email} | Password reset to: ${account.password}`
        );
        continue;
      }

      // New account — pass plain text password, pre-save hook hashes it
      await User.create({
        firstName: account.firstName,
        lastName: account.lastName,
        email: account.email,
        password: account.password, // plain text — model's pre-save hook hashes this
        systemRole: account.systemRole,
        role: account.role,
        department: account.department,
        employeeId: account.employeeId,
        dateOfBirth: account.dateOfBirth,
        countryCode: account.countryCode,
        dialCode: account.dialCode,
        phoneNumber: account.phoneNumber,
        isEmailVerified: account.isEmailVerified,
        avatarUrl: account.avatarUrl,
      });

      console.log(
        `Created [${account.systemRole}]: ${account.email} | Password: ${account.password}`
      );
    }

    console.log("\nAdmin seeding complete!\n");
    console.log("-------------------------------------------------");
    console.log("  Login at: http://localhost:3000/admin-login");
    console.log("-------------------------------------------------");
    console.log("  Super Admin  -> superadmin@empsphere.io  | SuperAdmin@123");
    console.log("  System Admin -> sysadmin@empsphere.io    | SystemAdmin@123");
    console.log("  Admin        -> admin@empsphere.io       | Admin@123456");
    console.log("-------------------------------------------------\n");

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("Seeding failed:", err);
    process.exit(1);
  }
}

seedAdmins();
