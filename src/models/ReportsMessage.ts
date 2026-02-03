import { model, Schema } from "mongoose";

export enum ReportType {
  nazoratchilarKunlikTushum = "nazoratchilarKunlikTushum",
  sendMFYIncomeReport = "sendMFYIncomeReport",
  sendPinflMfyReport = "sendPinflMfyReport",
  sendEtkMfyReport = "sendEtkMfyReport",
  sendKunlikEtkReports = "sendKunlikEtkReports",
  sendKunlikPinflReports = "sendKunlikPinflReports",
  sendKunlikPhoneReports = "sendKunlikPhoneReports",
  xatlovchilarIshiHisobot = "xatlovchilarIshiHisobot",
  mahallaTushumlarNazoratchiKesimida = "mahallaTushumlarNazoratchiKesimida",
  specialTaskReportByMFY = "specialTaskReportByMFY",
}

interface IReportsMessage {
  message_id: number;
  chat_id: number;
  date: number;
  type: ReportType;
  companyId: number;
}

const schema = new Schema<IReportsMessage>({
  message_id: {
    type: Number,
    required: true,
  },
  chat_id: {
    type: Number,
    required: true,
  },
  date: {
    type: Number,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  companyId: {
    type: Number,
    required: true,
  },
});

export const ReportsMessage = model<IReportsMessage>("reports_message", schema);
