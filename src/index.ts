// Bismillah
import "dotenv/config";
import express, {
  NextFunction,
  Request,
  Response,
  ErrorRequestHandler,
} from "express";
import cors from "cors";
import isAuth from "./middlewares/isAuth.ts";
import { app, server } from "./config/socketConfig.js";
import { agenda } from "./config/agenda.js";
import { connectDb } from "./config/connectDB.ts";
import { bot } from "./bot/core/bot.js";
import updateAbonentsFromTozamakon from "./intervals/updateAbonentsFromTozamakon.js";
import { queueNames } from "./constants.js";
import { LastUpdate } from "./models/LastUpdate.js";

const launchBot = true;

if (!process.env.SECRET_JWT_KEY || !process.env.REFRESH_JWT_KEY) {
  console.error(
    "SECRET_JWT_KEY or REFRESH_JWT_KEY environment variable is not defined"
  );
  process.exit(1);
}

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("Xatolik ushlangan:", err);
});

// App middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

if (launchBot) {
  if (process.env.NODE_ENV === "development") {
    bot
      .launch(() => {
        console.log("Bot has been started. Polling is enabled.");
      })
      .catch((err: Error) => {
        console.log(err);
      });
  } else {
    const WEBHOOK_PATH = "/bot" + process.env.TOKEN;
    const WEBHOOK_URL = "https://api.greenzone.uz" + WEBHOOK_PATH;
    app.use(bot.webhookCallback(WEBHOOK_PATH));
    bot.telegram.setWebhook(WEBHOOK_URL);
    console.log("Bot has been started. Webhook is enabled.");
  }
}

connectDb();

// use routers
import authRouter from "./routers/auth.route";
import statisticsRouter from "./routers/statisticsRouter.js";
import notificationRouter from "./routers/notificationRouter.js";
import sudRouter from "./routers/sudRouter.js";
import targetsRouter from "./routers/targetsRouter.js";
import bildirgilarRouter from "./routers/bildirgilarRouter.js";
import fetchTelegramRouter from "./routers/fetchTelegramRouter.js";
import aktPachkaRouter from "./routers/aktPachka.js";
import kiruvchiXujjatlarRouter from "./routers/kiruvchiXujjatlar.js";
import inspectorsRouter from "./routers/inspectorsRouter.js";
import abonentsRouter from "./routers/abonentsRouter.js";
import billingRouter from "./routers/billing.js";
import arizalarRouter from "./routers/arizalar.route.js";
import newAbonentsRouter from "./routers/newAbonentsRouter.js";
import yashovchiSoniXatlovRouter from "./routers/yashovchiSoniXatlov.js";
import reportsRouter from "./routers/reportsRouter.js";
import actsRouter from "./routers/actsRouter.js";
import { ZodError } from "zod";

app.use("/api/auth", authRouter);
app.use("/api/statistics", isAuth, statisticsRouter);
app.use("/api/notification", isAuth, notificationRouter);
app.use("/api/court-service", isAuth, sudRouter);
app.use("/api/targets", isAuth, targetsRouter);
app.use("/api/bildirgilar", isAuth, bildirgilarRouter);
app.use("/api/fetchTelegram", isAuth, fetchTelegramRouter);
app.use("/api/pachkalar", isAuth, aktPachkaRouter);
app.use("/api/documents", isAuth, kiruvchiXujjatlarRouter);
app.use("/api/inspectors", isAuth, inspectorsRouter);
app.use("/api/abonents", isAuth, abonentsRouter);
app.use("/api/billing", isAuth, billingRouter);
app.use("/api/arizalar", isAuth, arizalarRouter);
app.use("/api/pendingNewAbonents", isAuth, newAbonentsRouter);
app.use("/api/yashovchi-soni-xatlov", isAuth, yashovchiSoniXatlovRouter);
app.use("/api/reports", isAuth, reportsRouter);
app.use("/api/acts", isAuth, actsRouter);

const globalErrorHandler: ErrorRequestHandler = (err, req, res, next): any => {
  if (err instanceof ZodError) {
    return res.status(400).json({
      ok: false,
      message: "Invalid request data",
      issues: err.issues,
    });
  }

  console.error(err);
  res.status(500).json({
    ok: false,
    message: "Internal server error",
  });
};

app.use(globalErrorHandler);

// telegram bot
function useTelegramBot() {
  import("./bot/core/bot.js");
  import("./bot/middlewares/index.js");
  import("./bot/actions/index");
}
useTelegramBot();

process.on("warning", (warning) => {
  console.warn(warning.stack);
});

// Schedule jobs

agenda.on("ready", async () => {
  console.log("Agenda is ready to use!");
  import("./intervals/index.js");
  agenda.start();
  agenda.every("0 9,11,13,17 * * *", "sendMFYIncomeReportTask");
  agenda.every("0 9-21 * * *", "sendMFYIncomeReportTaskNurobod");
  agenda.every("5 9-22 * * *", "sendKunlikPinflReportsTask");
  agenda.every("8 9-22 * * *", "sendKunlikEtkReportsTask");
  agenda.every("0 9-22 * * *", "sendPinflMfyReportTask");
  agenda.every("0 9-22 * * *", "sendEtkMfyReportTask");
  agenda.every("0 9-22 * * *", "nazoratchilarKunlikTushumTask");
});

agenda.on("error", (error: Error) => {
  console.error("Agenda error:", error);
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server listening port: ${PORT}`);
});
