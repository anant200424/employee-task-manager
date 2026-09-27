
import mongoose from "mongoose";
import User from "./models/User";

const admins = [
  ["Super", "Admin", "superadmin@empsphere.io", "super_admin", "Super Admin", "EMP-0001", "SUPER_ADMIN_PASSWORD"],
  ["System", "Admin", "sysadmin@empsphere.io", "system_admin", "System Admin", "EMP-0002", "SYSTEM_ADMIN_PASSWORD"],
  ["Admin", "Account", "admin@empsphere.io", "admin", "Admin", "EMP-0003", "ADMIN_PASSWORD"],
  ["Team", "Manager", "manager@empsphere.io", "manager", "Manager", "EMP-0004", "MANAGER_PASSWORD"],
] as const;

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

const departments = [
  "Engineering", "Human Resources", "Finance",
  "Marketing", "Sales", "Operations", "IT & Security",
];

async function main() {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error("MONGO_URI is missing.");

  for (const admin of admins) {
    const password = process.env[admin[6]];
    if (!password || password.length < 12) {
      throw new Error(`${admin[6]} must be set (minimum 12 characters).`);
    }
  }

  const demoPassword = process.env.DEMO_EMPLOYEE_PASSWORD;
  if (!demoPassword || demoPassword.length < 12) {
    throw new Error("DEMO_EMPLOYEE_PASSWORD must be set (minimum 12 characters).");
  }

  try {
    await mongoose.connect(uri, { dbName: "employeeDB" });
    console.log("Connected to employeeDB.");

    let adminsCreated = 0;
    let adminsSkipped = 0;

    for (const a of admins) {
      const [firstName, lastName, email, systemRole, role, employeeId, key] = a;

      // Skip if either identifier already exists; never reset passwords.
      const exists = await User.exists({
        $or: [{ email }, { employeeId }],
      });

      if (exists) {
        adminsSkipped++;
        continue;
      }

      await new User({
        firstName, lastName, email, systemRole, role, employeeId,
        password: process.env[key],
        department: systemRole === "manager" ? "Operations" : "Administration",
        countryCode: "IN",
        dialCode: "+91",
        phoneNumber: String(9000000001 + adminsCreated),
        dateOfBirth: new Date("1995-01-15"),
        isEmailVerified: true,
      }).save();

      adminsCreated++;
    }

    let employeesCreated = 0;
    let employeesSkipped = 0;

    for (let i = 1; i <= 100; i++) {
      const n = String(i).padStart(4, "0");
      const email = `demo.employee${n}@empsphere.io`;
      const employeeId = `DEMO-${n}`;

      // Check both email and employee ID before every insert.
      const exists = await User.exists({
        $or: [{ email }, { employeeId }],
      });

      if (exists) {
        employeesSkipped++;
        continue;
      }

      await new User({
        firstName: firstNames[(i - 1) % firstNames.length],
        lastName: lastNames[Math.floor((i - 1) / firstNames.length) % lastNames.length],
        email,
        employeeId,
        password: demoPassword,
        systemRole: "employee",
        role: "Software Engineer",
        department: departments[(i - 1) % departments.length],
        countryCode: "IN",
        dialCode: "+91",
        phoneNumber: String(9100000000 + i),
        dateOfBirth: new Date(1990 + (i % 10), i % 12, (i % 27) + 1),
        isEmailVerified: true,
      }).save();

      employeesCreated++;
    }

    console.log(JSON.stringify({
      adminsCreated,
      adminsSkipped,
      employeesCreated,
      employeesSkipped,
      totalDemoEmployees: await User.countDocuments({
        email: /^demo\.employee\d{4}@empsphere\.io$/,
      }),
    }, null, 2));
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((err) => {
  console.error("Seeding failed:", err.message);
  process.exitCode = 1;
});
