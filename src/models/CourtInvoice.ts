import { model, Schema } from "mongoose";

interface ICourtInvoice {
  _id: string;
  amount: number;
  court: string;
  courtId: number;
  forAccount: string;
  mustPayAmount: number;
  issued: Date;
  number: string;
  payer: string;
  invoiceStatus: "CREATED" | "PAID";
  overdue: Date;
  companyId: number;
}

const schema = new Schema<ICourtInvoice>({
  amount: { type: Number, required: true },
  court: { type: String },
  courtId: { type: Number, required: true },
  forAccount: { type: String },
  mustPayAmount: { type: Number, required: true },
  issued: { type: Date, required: true },
  number: { type: String, required: true },
  payer: { type: String },
  overdue: { type: Date },
  companyId: { type: Number, required: true },
  invoiceStatus: { type: String, required: true },
});

export const CourtInvoice = model<ICourtInvoice>("court_invoice", schema);
