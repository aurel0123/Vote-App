import { Server } from "socket.io";
import type { Server as HttpServer } from "http";
import { env } from "./env.js";

let io: Server;

export function initSocket(httpServer: HttpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: env.FRONTEND_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    // Le client rejoint la room de l'événement pour recevoir les updates
    socket.on("join:event", (eventId: string) => {
      socket.join(`event:${eventId}`);
    });

    socket.on("leave:event", (eventId: string) => {
      socket.leave(`event:${eventId}`);
    });

    socket.on("disconnect", () => {});
  });

  console.log("⚡ Socket.io initialisé");
  return io;
}

// Émettre une mise à jour du classement à tous les clients d'un événement
export function emitVoteUpdate(eventId: string, data: object) {
  if (io) {
    io.to(`event:${eventId}`).emit("vote:update", data);
  }
}

export { io };