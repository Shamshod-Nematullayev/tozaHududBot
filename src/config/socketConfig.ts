import { Socket } from "socket.io";

import { Server } from "socket.io";
import http from "http";
import express from "express";
import jwt from "jsonwebtoken";
const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: true,
    credentials: true,
  },
});

const usersMapSocket: { [key: string]: string[] } = {};
io.on("connection", (socket: Socket) => {
  try {
    const decoded = jwt.verify(
      socket.handshake.query.toString(),
      process.env.SECRET_JWT_KEY as string
    ) as { id: string };

    if (!usersMapSocket[decoded.id]) usersMapSocket[decoded.id] = [];

    usersMapSocket[decoded.id].push(socket.id);

    socket.on("disconnect", () => {
      usersMapSocket[decoded.id] = usersMapSocket[decoded.id].filter(
        (id) => id !== socket.id
      );
    });
  } catch (error) {
    // console.error(error.message);
  }
});

export { io, app, server, usersMapSocket };
