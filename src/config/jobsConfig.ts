import { sendKunlikEtkReports } from "intervals/kunlikEtkReports.js";
import { sendKunlikPinflReports } from "intervals/kunlikPinflReports.js";
import { mahallaTushumlarNazoratchiKesimida } from "intervals/mahallaTushumlarNazoratchiKesimida.js";
import { sendEtkMfyReport } from "intervals/sendEtkMfyReport.js";
import { sendMFYIncomeReport } from "intervals/sendMFYIncomeReport.js";
import { specialTaskReport } from "intervals/specialTaskReport.js";
import xatlovchilarIshiHisobot from "intervals/xatlovchilarIshiHisobot.js";

interface IJobConfig {
  name: string;
  schedule: string;
  handler: () => Promise<void>;
}

export const jobsConfig: IJobConfig[] = [
  {
    name: "sendMFYIncomeReportTask",
    schedule: "0 9,12,17,19 * * *",
    handler: async () => {
      await sendMFYIncomeReport(1144, false, false, true);
      await sendMFYIncomeReport(1824, false, false, false);
    },
  },
  {
    name: "nazoratchilarKunlikTushumTask",
    schedule: "0 9,12,15,17,20 * * *",
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
    },
  },
  {
    name: "maxsusTopshiriq",
    schedule: "0 13,19, * * *",
    handler: async () => {
      await specialTaskReport(1144, "phone");
      await specialTaskReport(1144, "electricity");
    },
  },
];
