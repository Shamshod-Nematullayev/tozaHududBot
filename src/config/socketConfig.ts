import { Socket } from "socket.io";

import { Server } from "socket.io";
import http from "http";
import express from "express";
import jwt from "jsonwebtoken";
const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    credentials: true,
  },
});

const usersMapSocket: any = {};
io.on("connection", (socket: Socket) => {
  try {
    const decoded = jwt.verify(
      socket.handshake.query.toString(),
      process.env.SECRET_JWT_KEY as string
    ) as { id: string };
    usersMapSocket[decoded.id] = socket.id; // User._id = socket.id
    socket.on("disconnect", () => {
      delete usersMapSocket[decoded.id];
    });
  } catch (error) {
    // console.error(error.message);
  }
});

export { io, app, server, usersMapSocket };
