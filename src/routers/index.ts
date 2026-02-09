import { Router } from "express";
const mainRouter = Router();

// routers
import authRouter from "./auth.route.js";
import statisticsRouter from "./statisticsRouter.js";
import notificationRouter from "./notificationRouter.js";
import sudRouter from "./sudRouter.js";
import targetsRouter from "./targetsRouter.js";
import bildirgilarRouter from "./bildirgilarRouter.js";
import fetchTelegramRouter from "./telegram.route.js";
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
import foldersRouter from "./folders.route.js";
import automobilesRouter from "./automobiles.route.js";
import mahallaRouter from "./mahallaRouter.js";
import downloadTemplatesRouter from "./downloadTemplates.route.js";
import tasksRouter from "./tasks.route.js";

// middlewares
import isAuth from "@middlewares/isAuth.js";
import allowRoles from "@middlewares/allowRoles.js";
import { globalErrorHandler } from "./controllers/utils/globalErrorHandler.js";
import { readOnlyGlobal } from "@middlewares/readOnlyGlobal.js";

// 🔓 public
mainRouter.use("/auth", authRouter);

// 🔐 protected (GLOBAL)
mainRouter.use(isAuth);
mainRouter.use(readOnlyGlobal);

// 📦 routes
mainRouter.use("/statistics", statisticsRouter);
mainRouter.use("/notification", notificationRouter);

mainRouter.use("/court-service", allowRoles(["admin", "yurist"]), sudRouter);

mainRouter.use("/targets", allowRoles(["admin", "yurist"]), targetsRouter);

mainRouter.use(
  "/bildirgilar",
  allowRoles(["admin", "yurist"]),
  bildirgilarRouter
);

mainRouter.use("/fetchTelegram", fetchTelegramRouter);
mainRouter.use("/pachkalar", aktPachkaRouter);
mainRouter.use("/documents", kiruvchiXujjatlarRouter);
mainRouter.use("/inspectors", inspectorsRouter);
mainRouter.use("/abonents", abonentsRouter);
mainRouter.use("/billing", billingRouter);

mainRouter.use("/arizalar", allowRoles(["admin", "billing"]), arizalarRouter);

mainRouter.use("/pendingNewAbonents", newAbonentsRouter);
mainRouter.use("/yashovchi-soni-xatlov", yashovchiSoniXatlovRouter);
mainRouter.use("/reports", reportsRouter);
mainRouter.use("/acts", actsRouter);

mainRouter.use("/gps", allowRoles(["admin", "gps"]), gpsRouter);

mainRouter.use("/folders", allowRoles(["admin", "billing"]), foldersRouter);

mainRouter.use(
  "/automobiles",
  allowRoles(["admin", "gps", "billing"]),
  automobilesRouter
);

mainRouter.use("/mahallas", mahallaRouter);
mainRouter.use("/download-templates", downloadTemplatesRouter);

mainRouter.use("/tasks", allowRoles(["admin", "billing"]), tasksRouter);

// ❗ error handler
mainRouter.use(globalErrorHandler);

export default mainRouter;
