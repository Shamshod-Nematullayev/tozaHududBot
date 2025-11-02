import { sendKunlikEtkReports } from "intervals/kunlikEtkReports.js";
import { sendKunlikPinflReports } from "intervals/kunlikPinflReports.js";
import { mahallaTushumlarNazoratchiKesimida } from "intervals/mahallaTushumlarNazoratchiKesimida.js";
import { sendEtkMfyReport } from "intervals/sendEtkMfyReport.js";
import { sendMFYIncomeReport } from "intervals/sendMFYIncomeReport.js";
import xatlovchilarIshiHisobot from "intervals/xatlovchilarIshiHisobot.js";

interface IJobConfig {
  name:
    | "sendKunlikPinflReportsTask"
    | "sendKunlikEtkReportsTask"
    | "sendMFYIncomeReportTask"
    | "nazoratchilarKunlikTushumTask";
  schedule: string;
  handler: () => Promise<void>;
}

export const jobsConfig: IJobConfig[] = [
  {
    name: "sendKunlikPinflReportsTask",
    schedule: "15 9-22 * * *",
    handler: async () => {
      // parametrlar oson o'zgarishi uchun massiv ishlating
      console.log("nahotki");
      xatlovchilarIshiHisobot(1144);
    },
  },
  {
    name: "sendKunlikEtkReportsTask",
    schedule: "0 9,11,13,15,17,19,21,23 * * *",
    handler: async () => {
      const companyIds = [621];
      for (const id of companyIds) {
        await sendKunlikEtkReports(id);
        await sendKunlikPinflReports(id);
      }
    },
  },
  {
    name: "sendMFYIncomeReportTask",
    schedule: "0 9 * * *",
    handler: async () => {
      await sendMFYIncomeReport(1144, false, false, true);
      await sendMFYIncomeReport(1824, false, false, false);
    },
  },
  {
    name: "nazoratchilarKunlikTushumTask",
    schedule: "0 9-22 * * *",
    handler: async () => {
      await mahallaTushumlarNazoratchiKesimida({
        companyId: 1144,
        from: new Date(),
        to: new Date(),
        shouldDeleteLastReport: true,
      });
      await mahallaTushumlarNazoratchiKesimida({
        companyId: 1824,
        from: new Date(),
        to: new Date(),
        shouldDeleteLastReport: false,
      });

      await sendKunlikEtkReports(1144);
      await sendEtkMfyReport(1144);
    },
  },
];
