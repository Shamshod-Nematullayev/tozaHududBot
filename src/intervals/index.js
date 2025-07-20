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

// Define tasks with Agenda

agenda.define("sendKunlikPinflReportsTask", async () => {
  // await sendKunlikPinflReports(1265);
  // await sendKunlikPinflReports(1143);
  await sendKunlikPinflReports(621);
  await sendKunlikPinflReports(337);
  // await sendKunlikPinflReports(1263);
  await sendKunlikPhoneReports(1144);
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
  await sendMFYIncomeReport(1144);
});
agenda.define("sendMFYIncomeReportTaskNurobod", async () => {
  // await sendMFYIncomeReport(1263, false, true);
});

agenda.define("sendPinflMfyReportTask", async () => {
  await sendPinflMfyReport(1144);
  // sendPinflMfyReport(1143);
  // await sendIdentifietMfyReport(1265);
});

agenda.define("sendEtkMfyReportTask", async () => {
  await sendEtkMfyReport(1144);
  // sendEtkMfyReport(1143);
  // await sendIdentifietMfyReport(1265);
});

agenda.define("nazoratchilarKunlikTushumTask", async () => {
  await nazoratchilarKunlikTushum(1144);
  // await nazoratchilarKunlikTushum(1265);
});
