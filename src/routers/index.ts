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
import foldersRouter from "./folders.route.js";
import automobilesRouter from "./automobiles.route.js";
import isAuth from "@middlewares/isAuth.js";
import allowRoles from "@middlewares/allowRoles.js";
import { globalErrorHandler } from "./controllers/utils/globalErrorHandler.js";

mainRouter.use("/auth", authRouter);
mainRouter.use("/statistics", isAuth, statisticsRouter);
mainRouter.use("/notification", isAuth, notificationRouter);
mainRouter.use(
  "/court-service",
  isAuth,
  allowRoles(["admin", "yurist"]),
  sudRouter,
);
mainRouter.use(
  "/targets",
  allowRoles(["admin", "yurist"]),
  isAuth,
  targetsRouter,
);
mainRouter.use(
  "/bildirgilar",
  allowRoles(["admin", "yurist"]),
  isAuth,
  bildirgilarRouter,
);
mainRouter.use("/fetchTelegram", isAuth, fetchTelegramRouter);
mainRouter.use("/pachkalar", isAuth, aktPachkaRouter);
mainRouter.use("/documents", isAuth, kiruvchiXujjatlarRouter);
mainRouter.use("/inspectors", isAuth, inspectorsRouter);
mainRouter.use("/abonents", isAuth, abonentsRouter);
mainRouter.use("/billing", isAuth, billingRouter);
mainRouter.use(
  "/arizalar",
  isAuth,
  allowRoles(["admin", "billing"]),
  arizalarRouter,
);
mainRouter.use("/pendingNewAbonents", isAuth, newAbonentsRouter);
mainRouter.use("/yashovchi-soni-xatlov", isAuth, yashovchiSoniXatlovRouter);
mainRouter.use("/reports", isAuth, reportsRouter);
mainRouter.use("/acts", isAuth, actsRouter);
mainRouter.use("/gps", isAuth, allowRoles(["admin", "gps"]), gpsRouter);
mainRouter.use(
  "/folders",
  isAuth,
  allowRoles(["admin", "billing"]),
  foldersRouter,
);
mainRouter.use("/automobiles", isAuth, automobilesRouter);

// global error handler
mainRouter.use(globalErrorHandler);

export default mainRouter;
