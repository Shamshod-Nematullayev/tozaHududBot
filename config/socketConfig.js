const { Server } = require("socket.io");
const http = require("http");
const express = require("express");
const app = express();
const server = http.createServer(app);

const io = new Server(server);

const usersMap = {};
io.on("connection", (socket) => {
  console.log("a user connected", socket);
});

module.exports = { io, app, server };
