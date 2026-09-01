import mongoose from "mongoose";
import "dotenv/config";
import User from "./src/models/User";

async function run() {
  await mongoose.connect(process.env.MONGO_URI as string);
  console.log("Connected to DB");

  // The email was misspelled during initial seeding!
  const misspelledEmail = "anantsing20334411@gmail.com";
  const correctEmail = "anantsingh20334411@gmail.com";

  let admin = await User.findOne({ email: misspelledEmail });
  
  if (!admin) {
    // Maybe we already fixed it, let's check for the correct email
    admin = await User.findOne({ email: correctEmail });
  }

  if (admin) {
    admin.email = correctEmail; // Fix the typo in the database!
    admin.password = "Anant@3200"; // Ensure password is set properly (Mongoose will hash it)
    await admin.save();
    console.log(`Admin account correctly updated!`);
    console.log(`Email is now: ${admin.email}`);
    console.log(`Password is: Anant@3200`);
  } else {
    // If neither exists, just create it correctly!
    console.log("Admin not found, creating from scratch with correct details...");
    await User.create({
      firstName: "Anant",
      lastName: "Singh",
      email: correctEmail,
      countryCode: "IN",
      dialCode: "+91",
      phoneNumber: "9999999999",
      dateOfBirth: new Date("2000-01-01"),
      password: "Anant@3200",
      role: "admin",
      isEmailVerified: true
    });
    console.log("Admin correctly created from scratch!");
  }

  await mongoose.disconnect();
}

run().catch(console.error);
