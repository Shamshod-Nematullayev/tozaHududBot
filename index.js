// Bismillah
const launchBot = true;
require("dotenv").config();
if (!process.env.SECRET_JWT_KEY || !process.env.REFRESH_JWT_KEY) {
  console.error(
    "SECRET_JWT_KEY or REFRESH_JWT_KEY environment variable is not defined"
  );
  process.exit(1);
}
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

// process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0";
const express = require("express");
const cors = require("cors");
const isAuth = require("./middlewares/isAuth");
const { app, server } = require("./config/socketConfig");
const {
  updateAbonentsFromTozamakon,
} = require("./intervals/updateAbonentsFromTozamakon");
const { agenda } = require("./config/agenda");
const { queueNames } = require("./constants");
const { LastUpdate } = require("./models/LastUpdate");
const { connectDb } = require("./config/connectDB");
const { bot } = require("./requires");

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
if (launchBot)
  if (process.env.NODE_ENV === "development") {
    bot
      .launch(() => {
        console.log("Bot has been started. Polling is enabled.");
      })
      .catch((err) => {
        console.log(err);
      });
  } else {
    const WEBHOOK_PATH = "/bot" + process.env.TOKEN;
    const WEBHOOK_URL = "https://greenzone.uz" + WEBHOOK_PATH;
    app.use(bot.webhookCallback(WEBHOOK_PATH));
    bot.telegram.setWebhook(WEBHOOK_URL);
    console.log("Bot has been started. Webhook is enabled.");
  }
connectDb();

// use routers
app.use("/api/auth", require("./routers/auth"));
app.use("/api/statistics", isAuth, require("./routers/statisticsRouter"));
app.use("/api/notification", isAuth, require("./routers/notificationRouter"));
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
app.use(
  "/api/pendingNewAbonents",
  isAuth,
  require("./routers/newAbonentsRouter")
);
app.use(
  "/api/yashovchi-soni-xatlov",
  isAuth,
  require("./routers/yashovchiSoniXatlov")
);
app.use("/api/reports", isAuth, require("./routers/reportsRouter"));
app.use("/api/acts", isAuth, require("./routers/actsRouter"));

app.use((req, res, next) => {
  res.status(404).json({
    ok: false,
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
});

// telegram bot
function useTelegramBot() {
  require("./core/bot");
  require("./middlewares");
  require("./actions");
}
useTelegramBot();

process.on("warning", (warning) => {
  console.warn(warning.stack);
});

// Schedule jobs

agenda.on("ready", async () => {
  console.log("Agenda is ready to use!");
  require("./intervals");
  agenda.start();
  agenda.every("0 9,11,13,17 * * *", "sendMFYIncomeReportTask"); // 09:00  to 17:00 every day
  agenda.every("0 9-21 * * *", "sendMFYIncomeReportTaskNurobod"); // 09:00 to 17:00 every day
  agenda.every("5 9-22 * * *", "sendKunlikPinflReportsTask"); // 09:05 to 22:05 every day
  agenda.every("5 9-22 * * *", "sendKunlikEtkReportsTask"); // 09:05 to 22:05 every day
  agenda.every("0 9-22 * * *", "sendPinflMfyReportTask"); // 09:00 to 22:00 every day
  agenda.every("0 9-22 * * *", "sendEtkMfyReportTask"); // 09:00 to 22:00 every day
  agenda.every("0 9-22 * * *", "nazoratchilarKunlikTushumTask"); // 09:00 to 22:00 every day

  // agenda.every("0 3 * * *", queueNames.updateAbonents, { companyId: 1144 });
  // const lastPage = await LastUpdate.findOne({ key: "abonents-last-page-1144" });
  // if (lastPage)
  //   agenda.now(queueNames.updateAbonents, {
  //     companyId: 1144,
  //     page: lastPage.page,
  //   });
});
agenda.on("error", (error) => {
  console.error("Agenda error:", error);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server listening port: ${PORT}`);
});
