import { Router } from "express";

const mainRouter = Router();

// use routers
import authRouter from "./auth.route.js";
import statisticsRouter from "./statisticsRouter.js";
import notificationRouter from "./notificationRouter.js";
import sudRouter from "./sudRouter.js";
import targetsRouter from "./targetsRouter.js";
import bildirgilarRouter from "./bildirgilarRouter.js";
import fetchTelegramRouter from "./fetchTelegramRouter.js";
import aktPachkaRouter from "./aktPachka.js";
import kiruvchiXujjatlarRouter from "./kiruvchiXujjatlar.js";
import inspectorsRouter from "./inspectorsRouter.js";
import abonentsRouter from "./abonentsRouter.js";
import billingRouter from "./billing.route.js";
import arizalarRouter from "./arizalar.route.js";
import newAbonentsRouter from "./newAbonentsRouter.js";
import yashovchiSoniXatlovRouter from "./yashovchiSoniXatlov.js";
import reportsRouter from "./reportsRouter.js";
import actsRouter from "./actsRouter.js";
import gpsRouter from "./gps.route.js";
import isAuth from "@middlewares/isAuth.js";
import allowRoles from "@middlewares/allowRoles.js";
import { globalErrorHandler } from "./controllers/utils/globalErrorHandler.js";

mainRouter.use("/api/auth", authRouter);
mainRouter.use("/api/statistics", isAuth, statisticsRouter);
mainRouter.use("/api/notification", isAuth, notificationRouter);
mainRouter.use(
  "/api/court-service",
  isAuth,
  allowRoles(["admin", "yurist"]),
  sudRouter
);
mainRouter.use("/api/targets", isAuth, targetsRouter);
mainRouter.use("/api/bildirgilar", isAuth, bildirgilarRouter);
mainRouter.use("/api/fetchTelegram", isAuth, fetchTelegramRouter);
mainRouter.use("/api/pachkalar", isAuth, aktPachkaRouter);
mainRouter.use("/api/documents", isAuth, kiruvchiXujjatlarRouter);
mainRouter.use("/api/inspectors", isAuth, inspectorsRouter);
mainRouter.use("/api/abonents", isAuth, abonentsRouter);
mainRouter.use("/api/billing", isAuth, billingRouter);
mainRouter.use(
  "/api/arizalar",
  isAuth,
  allowRoles(["admin", "admin"]),
  arizalarRouter
);
mainRouter.use("/api/pendingNewAbonents", isAuth, newAbonentsRouter);
mainRouter.use("/api/yashovchi-soni-xatlov", isAuth, yashovchiSoniXatlovRouter);
mainRouter.use("/api/reports", isAuth, reportsRouter);
mainRouter.use("/api/acts", isAuth, actsRouter);
mainRouter.use("/api/gps", isAuth, allowRoles(["admin", "gps"]), gpsRouter);
mainRouter.use(globalErrorHandler);

export default mainRouter;
