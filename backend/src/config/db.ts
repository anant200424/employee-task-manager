import mongoose from "mongoose";

export const connectDB = async (): Promise<void> => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error("[Database] MONGO_URI is not defined in environment variables.");
    process.exit(1);
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
