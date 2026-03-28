// Bismillah
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { app, server } from './config/socketConfig.js';
import { agenda } from './config/agenda.js';
import { connectDb } from './config/connectDB.js';
import { bot } from './bot/core/bot.js';
import cookieParser from 'cookie-parser';

const launchBot = process.env.LAUNCH_BOT === 'false' ? false : true;

if (!process.env.SECRET_JWT_KEY || !process.env.REFRESH_JWT_KEY) {
  console.error('SECRET_JWT_KEY or REFRESH_JWT_KEY environment variable is not defined');
  process.exit(1);
}

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Xatolik ushlangan:', err);
});

// App middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

if (launchBot) {
  if (process.env.NODE_ENV === 'development') {
    bot
      .launch(() => {
        console.log('Bot has been started. Polling is enabled.');
      })
      .catch((err: Error) => {
        console.log(err);
      });
  } else {
    const WEBHOOK_PATH = '/bot' + process.env.TOKEN;
    const WEBHOOK_URL = 'https://api.greenzone.uz' + WEBHOOK_PATH;
    app.use(bot.webhookCallback(WEBHOOK_PATH));
    bot.telegram.setWebhook(WEBHOOK_URL);
    console.log('Bot has been started. Webhook is enabled.');
  }
}

connectDb();

import { initJobs } from 'intervals/index.js';
import mainRouter from 'routers/index.js';
import { specialTaskReport, specialTaskReportByInspectorsDaily } from 'intervals/specialTaskReport.js';
import { createTozaMakonApi } from '@api/tozaMakon.js';
import { sendSmsWarning } from '@services/sms/sendSms.js';
import { createEskizApi } from '@api/eskizApi.js';
// import "specialBusinessFunctions/bindAbonentsToGeozone.js";
// importPhonesFromHET(1144, abonents);
// createActs2(621, abonents);

app.use('/api', mainRouter);

process.on('warning', (warning) => {
  console.warn(warning.stack);
});

// Schedule jobs

agenda.on('ready', async () => {
  console.log('Agenda is ready to use!');
  initJobs();
});

agenda.on('error', (error: Error) => {
  console.error('Agenda error:', error);
});

const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`Server listening port: ${PORT}`);
});

// (async () => {
//   const sms = await sendSmsWarning(createEskizApi(1144), {
//     accountNumber: '105120450661',
//     phone: 998992833227,
//     companyId: 1144,
//     companyPhone: '557052555',
//     debtAmount: 78954,
//     debtDate: '28.03.2026',
//     residentId: 13236117,
//   });
//   console.log(sms);
// })();
