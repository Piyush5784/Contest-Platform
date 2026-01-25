import type { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { JWT_PASSWORD } from "@/config";

export let io: Server;

const clients = new Map<string, Socket>();

export function setupSocketIO(httpServer: HttpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: "*",
    },
  });

  io.on("connection", (socket: Socket) => {
    const token = socket.handshake.auth.token as string | undefined;

    if (!token) {
      socket.disconnect();
      return;
    }

    try {
      const decoded = jwt.verify(token, JWT_PASSWORD) as { id: string };
      const userId = decoded.id;

      clients.set(userId, socket);

      socket.on("disconnect", () => {
        clients.delete(userId);
      });
    } catch {
      socket.disconnect();
    }
  });

  return io;
}

export function send(userId: string, event: string, data: unknown) {
  const socket = clients.get(userId);
  if (socket) {
    socket.emit(event, data);
  }
}
