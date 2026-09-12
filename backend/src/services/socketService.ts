import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";

export interface AuthenticatedSocket extends Socket {
  userId?: string;
}

let io: Server | null = null;

/**
 * Initialize Socket.io server instance attached to the HTTP server
 */
export const initSocket = (httpServer: HttpServer): Server => {
  io = new Server(httpServer, {
    cors: {
      origin: true,
      credentials: true,
    },
    pingTimeout: 30000,
    pingInterval: 25000,
    transports: ["websocket", "polling"],
  });

  // Authentication middleware: verify JWT access token on handshake
  io.use((socket: AuthenticatedSocket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        (socket.handshake.headers.authorization?.startsWith("Bearer ")
          ? socket.handshake.headers.authorization.split(" ")[1]
          : null);

      if (!token) {
        return next(new Error("Authentication required: token missing"));
      }

      const secret = process.env.JWT_ACCESS_SECRET as string;
      const decoded = jwt.verify(token, secret) as { userId: string };

      if (!decoded?.userId) {
        return next(new Error("Authentication failed: invalid payload"));
      }

      socket.userId = decoded.userId.toString();
      next();
    } catch {
      next(new Error("Authentication failed: invalid or expired token"));
    }
  });

  io.on("connection", (socket: AuthenticatedSocket) => {
    const userId = socket.userId;
    if (userId) {
      socket.join(`user:${userId}`);
    }

    socket.on("disconnect", () => {
      // Room departure handled automatically by socket.io
    });
  });

  return io;
};

/**
 * Access the active Socket.io server instance
 */
export const getIO = (): Server | null => io;

/**
 * Emits an event directly to a specific user's private room
 */
export const emitToUser = (userId: string, event: string, payload: any): void => {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, payload);
};

/**
 * Emits an event to all connected workspace clients
 */
export const emitToAll = (event: string, payload: any): void => {
  if (!io) return;
  io.emit(event, payload);
};

/**
 * Instantly notifies a user that their account was blocked or deactivated by an administrator
 */
export const emitUserBlocked = (userId: string): void => {
  emitToUser(userId, "auth:blocked", {
    userId,
    message: "Your account has been deactivated or blocked by an administrator.",
    timestamp: new Date().toISOString(),
  });
};

/**
 * Pushes a new notification instantly to the recipient
 */
export const emitNewNotification = (recipientId: string, notification: any): void => {
  emitToUser(recipientId, "notification:new", notification);
};

/**
 * Pushes a workspace announcement or message to all active users
 */
export const emitWorkspaceMessage = (message: any): void => {
  emitToAll("message:new", message);
};
