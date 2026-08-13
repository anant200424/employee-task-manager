import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import { connectDB } from "./config/db";

const PORT = process.env.PORT || 5000;

const startServer = async (): Promise<void> => {
  await connectDB();

  const server = app.listen(PORT, () => {
    console.log(`[Server] EmpSphere API listening on http://localhost:${PORT}`);
  });

  process.on("unhandledRejection", (err: Error) => {
    console.error("[Server] Unhandled Rejection:", err.message);
    server.close(() => process.exit(1));
  });
};

startServer();
