import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import mongoSanitize from "express-mongo-sanitize";
import hpp from "hpp";
import path from "path";

import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import taskRoutes from "./routes/taskRoutes";
import messageRoutes from "./routes/messageRoutes";
import notificationRoutes from "./routes/notificationRoutes";
import auditRoutes from "./routes/auditRoutes";
import projectRoutes from "./routes/projectRoutes";
import aiRoutes from "./routes/aiRoutes";
import { apiLimiter } from "./middleware/rateLimiter";
import { notFound, errorHandler } from "./middleware/errorHandler";
import { decryptPayloadMiddleware } from "./middleware/decryptPayload";

const app: Application = express();
app.set("trust proxy", 1);

// Security headers - permit cross-origin resources between port 3000 and 5000
app.use(helmet({ crossOriginResourcePolicy: false }));

// CORS — validated origin whitelist for frontend port 3000 and local network clients
// const allowedOrigins = [
//   process.env.CLIENT_URL,
//   "http://localhost:3000",
//   "http://127.0.0.1:3000",
// ].filter(Boolean) as string[];

const allowedOrigins = [
  process.env.CLIENT_URL,
  "https://employee-task-manager-iota.vercel.app",
  "https://employee-task-manager-8jace2c-anant-9029.vercel.app",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        origin.startsWith("http://localhost:") ||
        origin.startsWith("http://127.0.0.1:")
      ) {
        callback(null, true);
      } else {
        callback(new Error("Blocked by CORS policy: Origin not allowed."));
      }
    },
    credentials: true,
  }),
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// Auto-decrypt encrypted client payloads ({ data: "enc:<iv>:<cipher>" }) before sanitization and routing
app.use(decryptPayloadMiddleware);

// Sanitize req.body / req.query against NoSQL injection ($gt, $ne, etc.)
app.use(mongoSanitize());

// Prevent HTTP parameter pollution
app.use(hpp());

// Serve static uploaded files (avatars, covers, documents)
app.use("/uploads", express.static(path.resolve(__dirname, "../uploads")));

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

app.get("/", (_req, res) => {
  res.status(200).json({ success: true, message: "EmpSphere API is running." });
});

// General API burst protection
app.use("/api", apiLimiter);

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/audit-logs", auditRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/ai", aiRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
