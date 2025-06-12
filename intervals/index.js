const { agenda } = require("../config/agenda");
const { Company } = require("../requires");
const { createAktPack } = require("./createAktPack");
const { sendKunlikEtkReports } = require("./kunlikEtkReports");
const { sendKunlikPinflReports } = require("./kunlikPinflReports");
const { lastPayReportInspectors } = require("./lastPayReportInspectors");
const { nazoratchilarKunlikTushum } = require("./nazoratchilarKunlikTushum");
const { sendEtkMfyReport } = require("./sendEtkMfyReport");
const { sendIdentifietMfyReport } = require("./sendIdentifietMfyReport");
const { sendMFYIncomeReport } = require("./sendMFYIncomeReport");
const { sendPinflMfyReport } = require("./sendPinflMfyReport");
const { addUpdateArizaAktTask } = require("./updateArizaAkt");

// Define tasks with Agenda
agenda.define("createAktPackTask", async () => {
  createAktPack();
});

agenda.define("sendKunlikPinflReportsTask", async () => {
  // await sendKunlikPinflReports(1265);
  // await sendKunlikPinflReports(1143);
  await sendKunlikPinflReports(621);
  await sendKunlikPinflReports(337);
  // await sendKunlikPinflReports(1263);
});

agenda.define("sendKunlikEtkReportsTask", async () => {
  await sendKunlikEtkReports(1265);
  // await sendKunlikEtkReports(1143);
  // await sendKunlikEtkReports(1266);
  // await sendKunlikEtkReports(621);
  // await sendKunlikEtkReports(337);
});

agenda.define("sendMFYIncomeReportTask", async () => {
  await sendMFYIncomeReport(1265);
  // await sendMFYIncomeReport(1143);
  await sendMFYIncomeReport(1144);
});
agenda.define("sendMFYIncomeReportTaskNurobod", async () => {
  await sendMFYIncomeReport(1263, false, true);
});

agenda.define("sendPinflMfyReportTask", async () => {
  await sendPinflMfyReport(1144);
  // sendPinflMfyReport(1143);
  await sendIdentifietMfyReport(1265);
});

agenda.define("sendEtkMfyReportTask", async () => {
  await sendEtkMfyReport(1144);
  // sendEtkMfyReport(1143);
  await sendIdentifietMfyReport(1265);
});

agenda.define("nazoratchilarKunlikTushumTask", async () => {
  await nazoratchilarKunlikTushum(1144);
  await nazoratchilarKunlikTushum(1265);
});
