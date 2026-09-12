import dotenv from "dotenv";
dotenv.config();

import http from "http";
import app from "./app";
import { connectDB } from "./config/db";
import { initSocket } from "./services/socketService";

const PORT = process.env.PORT || 5000;

const startServer = async (): Promise<void> => {
  await connectDB();

  const httpServer = http.createServer(app);
  initSocket(httpServer);

  httpServer.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`[Server] EmpSphere API & WebSocket listening on http://0.0.0.0:${PORT} (Full access enabled)`);
  });

  process.on("unhandledRejection", (err: Error) => {
    console.error("[Server] Unhandled Rejection:", err.message);
    httpServer.close(() => process.exit(1));
  });
};

startServer();
