import { agenda } from "../config/agenda.js";
import { Company } from "@models/Company.js";
import { sendKunlikEtkReports } from "./kunlikEtkReports.js";
import { sendKunlikPhoneReports } from "./kunlikPhoneReports.js";
import { sendKunlikPinflReports } from "./kunlikPinflReports.js";
import { lastPayReportInspectors } from "./lastPayReportInspectors.js";
import { nazoratchilarKunlikTushum } from "./nazoratchilarKunlikTushum.js";
import { sendEtkMfyReport } from "./sendEtkMfyReport.js";
import { sendIdentifietMfyReport } from "./sendIdentifietMfyReport.js";
import { sendMFYIncomeReport } from "./sendMFYIncomeReport.js";
import { sendPinflMfyReport } from "./sendPinflMfyReport.js";
// import { addUpdateArizaAktTask } from './updateArizaAkt.js'
import xatlovchilarIshiHisobot from "./xatlovchilarIshiHisobot.js";
import { checkPaymentSudAkts } from "./court-service/checkPaymentSudAkts.js";
import { mahallaTushumlarNazoratchiKesimida } from "./mahallaTushumlarNazoratchiKesimida.js";
// checkPaymentSudAkts(1144);

// Define tasks with Agenda

mahallaTushumlarNazoratchiKesimida({
  companyId: 1824,
  from: new Date("2025-09-12"),
  to: new Date("2025-09-12"),
  onlyEcopay: false,
  shouldDeleteLastReport: false,
});

agenda.define("sendKunlikPinflReportsTask", async () => {
  // await sendKunlikPinflReports(1265);
  // await sendKunlikPinflReports(1143);
  // await sendKunlikPinflReports(621);
  // await sendKunlikPinflReports(337);
  // await sendKunlikPinflReports(1263);
  // await sendKunlikPhoneReports(1144);
  await xatlovchilarIshiHisobot(1144);
});

agenda.define("sendKunlikEtkReportsTask", async () => {
  // await sendKunlikEtkReports(1265);
  // await sendKunlikEtkReports(1143);
  // await sendKunlikEtkReports(1266);
  // await sendKunlikEtkReports(621);
  // await sendKunlikEtkReports(337);
});

agenda.define("sendMFYIncomeReportTask", async () => {
  // await sendMFYIncomeReport(1265);
  // await sendMFYIncomeReport(1143);
  await sendMFYIncomeReport(1144, false);
  await sendMFYIncomeReport(1824, true, true, false);
});

agenda.define("sendKattakurganShaharTushum", async () => {
  await sendMFYIncomeReport(1824, true, false, false);
});

agenda.define("sendPinflMfyReportTask", async () => {
  // await sendPinflMfyReport(1144);
  // sendPinflMfyReport(1143);
  // await sendIdentifietMfyReport(1265);
});

agenda.define("sendEtkMfyReportTask", async () => {
  // await sendEtkMfyReport(1144);
  // sendEtkMfyReport(1143);
  // await sendIdentifietMfyReport(1265);
});

agenda.define("nazoratchilarKunlikTushumTask", async () => {
  await nazoratchilarKunlikTushum(1144);
  // await nazoratchilarKunlikTushum(1265);
});
