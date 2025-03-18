const { Server } = require("socket.io");
const http = require("http");
const express = require("express");
const app = express();
const server = http.createServer(app);
const jwt = require("jsonwebtoken");

const io = new Server(server, {
  cors: {
    origin: "http://localhost:8000",
    credentials: true,
  },
});

const usersMap = {};
io.on("connection", (socket) => {
  try {
    const decoded = jwt.verify(
      socket.handshake.query.accessToken || "",
      process.env.SECRET_JWT_KEY
    );
    usersMap[decoded.id] = socket.id;

    socket.on("disconnect", () => {
      delete usersMap[decoded.id];
    });
  } catch (error) {
    console.error(error.message);
  }
});

module.exports = { io, app, server };
