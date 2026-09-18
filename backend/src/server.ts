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

  httpServer.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      console.error(
        `[Server] Port ${PORT} is already in use (EADDRINUSE). Please terminate the existing process.`,
      );
    } else {
      console.error("[Server] HTTP server error:", err);
    }
  });

  const gracefulShutdown = (signal: string) => {
    console.log(`[Server] Received ${signal}. Gracefully closing HTTP and WebSocket server...`);
    httpServer.close(() => {
      console.log("[Server] Server closed successfully.");
      process.exit(0);
    });
  };

  // Nodemon restart signal on Windows / POSIX
  process.once("SIGUSR2", () => {
    httpServer.close(() => {
      process.kill(process.pid, "SIGUSR2");
    });
  });

  process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

  process.on("unhandledRejection", (err: Error) => {
    console.error("[Server] Unhandled Rejection:", err.message);
  });
};

startServer();
