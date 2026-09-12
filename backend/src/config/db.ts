import mongoose from "mongoose";
import dns from "dns";

export const connectDB = async (): Promise<void> => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error(
      "[Database] MONGO_URI is not defined in environment variables.",
    );
    process.exit(1);
  }

  // Ensure reliable DNS resolution for MongoDB Atlas SRV records on Windows
  if (uri.startsWith("mongodb+srv://")) {
    try {
      dns.setServers(["8.8.8.8", "1.1.1.1"]);
    } catch (e) {
      console.warn("[Database] Custom DNS setup skipped:", e);
    }
  }

  try {
    mongoose.set("strictQuery", true);
    const conn = await mongoose.connect(uri);
    console.log(`[Database] MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("[Database] Connection failed:", (error as Error).message);
    process.exit(1);
  }

  mongoose.connection.on("disconnected", () => {
    console.warn("[Database] MongoDB disconnected.");
  });
};
