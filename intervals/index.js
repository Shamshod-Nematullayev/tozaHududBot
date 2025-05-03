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

const Agenda = require("agenda");

const agenda = new Agenda({
  db: { address: process.env.MONGO, collection: "agendaJobs" },
});

// Define tasks with Agenda
agenda.define("createAktPackTask", async () => {
  createAktPack();
});

agenda.define("sendKunlikPinflReportsTask", async () => {
  await sendKunlikPinflReports(1265);
  await sendKunlikPinflReports(1143);
  await sendKunlikPinflReports(621);
  await sendKunlikPinflReports(337);
  await sendKunlikPinflReports(1263);
});

agenda.define("sendKunlikEtkReportsTask", async () => {
  await sendKunlikEtkReports(1265);
  await sendKunlikEtkReports(1143);
  await sendKunlikEtkReports(1266);
  await sendKunlikEtkReports(621);
  await sendKunlikEtkReports(337);
});

agenda.define("sendMFYIncomeReportTask", async () => {
  await sendMFYIncomeReport(1265);
  await sendMFYIncomeReport(1143);
  await sendMFYIncomeReport(1144);
  await sendMFYIncomeReport(1263, false, true);
});

agenda.define("sendPinflMfyReportTask", async () => {
  sendPinflMfyReport(1144);
  sendPinflMfyReport(1143);
  sendIdentifietMfyReport(1265);
});

agenda.define("sendEtkMfyReportTask", async () => {
  sendEtkMfyReport(1144);
  sendEtkMfyReport(1143);
  sendIdentifietMfyReport(1265);
});

agenda.define("nazoratchilarKunlikTushumTask", async () => {
  const companies = await Company.find();
  companies.forEach((company) => {
    if (company.ekopayLogin) {
      nazoratchilarKunlikTushum(company.id);
    }
  });
});

// Schedule jobs

agenda.on("ready", () => {
  console.log("Agenda is ready to use!");
  agenda.start();
  // agenda.every("0 9 * * *", "createAktPackTask"); // 09:00 every day
  agenda.every("0 9-17 * * *", "sendMFYIncomeReportTask"); // 09:00 to 17:00 every day
  agenda.every("5 9-22 * * *", "sendKunlikPinflReportsTask"); // 09:05 to 22:05 every day
  agenda.every("5 9-22 * * *", "sendKunlikEtkReportsTask"); // 09:05 to 22:05 every day
  agenda.every("0 9-22 * * *", "sendPinflMfyReportTask"); // 09:00 to 22:00 every day
  agenda.every("0 9-22 * * *", "sendEtkMfyReportTask"); // 09:00 to 22:00 every day
  agenda.every("0 9-22 * * *", "nazoratchilarKunlikTushumTask"); // 09:00 to 22:00 every day
});
agenda.on("error", (error) => {
  console.error("Agenda error:", error);
});
