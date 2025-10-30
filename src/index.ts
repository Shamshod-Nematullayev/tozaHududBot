// Bismillah
import "dotenv/config";
import express from "express";
import cors from "cors";
import { app, server } from "./config/socketConfig.js";
import { agenda } from "./config/agenda.js";
import { connectDb } from "./config/connectDB.js";
import { bot } from "./bot/core/bot.js";

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

// if (launchBot) {
//   if (process.env.NODE_ENV === "development") {
//     bot
//       .launch(() => {
//         console.log("Bot has been started. Polling is enabled.");
//       })
//       .catch((err: Error) => {
//         console.log(err);
//       });
//   } else {
//     const WEBHOOK_PATH = "/bot" + process.env.TOKEN;
//     const WEBHOOK_URL = "https://api.greenzone.uz" + WEBHOOK_PATH;
//     app.use(bot.webhookCallback(WEBHOOK_PATH));
//     bot.telegram.setWebhook(WEBHOOK_URL);
//     console.log("Bot has been started. Webhook is enabled.");
//   }
// }

connectDb();

import "test/index.js";
import { initJobs } from "intervals/index.js";
import abonents from "./test/abonents.json";
import mainRouter from "routers/index.js";
import axios from "axios";
import { createSmartGpsApi } from "@api/smartGPSApi.js";
// createActs2(621, abonents);

app.use("/api", mainRouter);

process.on("warning", (warning) => {
  console.warn(warning.stack);
});

// Schedule jobs

agenda.on("ready", async () => {
  console.log("Agenda is ready to use!");
  initJobs();
});

agenda.on("error", (error: Error) => {
  console.error("Agenda error:", error);
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server listening port: ${PORT}`);
});

(async () => {
  const smartGpsApi = createSmartGpsApi(1144);
  const a = await smartGpsApi.post(
    "/wialon/ajax.html?svc=resource/get_zone_data",
    {
      params: JSON.stringify({
        itemId: 37,
        flags: 28,
      }),
    }
  );
  console.log(a.data);
})();
