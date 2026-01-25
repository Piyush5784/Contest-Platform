import type { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";

export function setupSocketIO(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
    },
  });

  io.on("connection", (socket: Socket) => {});

  return io;
}
