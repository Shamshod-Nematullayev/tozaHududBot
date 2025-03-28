// Bismillah
require("dotenv").config();
if (!process.env.SECRET_JWT_KEY || !process.env.REFRESH_JWT_KEY) {
  console.error(
    "SECRET_JWT_KEY or REFRESH_JWT_KEY environment variable is not defined"
  );
  process.exit(1);
}
// process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0";
const { default: mongoose } = require("mongoose");
const express = require("express");
const cors = require("cors");
const isAuth = require("./middlewares/isAuth");
const { app, server } = require("./config/socketConfig");

// App middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(
  cors({
    origin: true,
    // origin: "http://localhost:8000",
    credentials: true,
  })
);

// use routers
app.use("/api/auth", require("./routers/auth"));
app.use("/api/statistics", isAuth, require("./routers/statisticsRouter"));
app.use("/api/court-service", isAuth, require("./routers/sudRouter"));
app.use("/api/targets", isAuth, require("./routers/targetsRouter"));
app.use("/api/bildirgilar", isAuth, require("./routers/bildirgilarRouter"));
app.use("/api/fetchTelegram", isAuth, require("./routers/fetchTelegramRouter"));
app.use("/api/pachkalar", isAuth, require("./routers/aktPachka"));
app.use("/api/documents", isAuth, require("./routers/kiruvchiXujjatlar"));
app.use("/api/inspectors", isAuth, require("./routers/inspectorsRouter"));
app.use("/api/abonents", isAuth, require("./routers/abonentsRouter"));
app.use("/api/billing", isAuth, require("./routers/billing"));
app.use("/api/arizalar", isAuth, require("./routers/arizalarRouter"));
app.use("/api/notification", isAuth, require("./routers/notificationRouter"));
app.use(
  "/api/yashovchi-soni-xatlov",
  isAuth,
  require("./routers/yashovchiSoniXatlov")
);

app.use((req, res, next) => {
  res.status(404).json({
    ok: false,
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
});

process.on("warning", (warning) => {
  console.warn(warning.stack);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server listening port: ${PORT}`);
});

// telegram bot
function useTelegramBot() {
  require("./core/bot");
  require("./middlewares");
  require("./actions");
  require("./intervals");
}
useTelegramBot();
// require("./test");
mongoose
  .connect(process.env.MONGO)
  .then(async () => {
    console.log(`Ma'lumotlar bazasiga ulandi`);
    require("./test");
  })
  .catch((err) => {
    throw err;
  });
