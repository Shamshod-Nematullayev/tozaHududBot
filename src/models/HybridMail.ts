import mongoose, { Document, Schema, Types } from "mongoose";

interface IHybridMail {
  residentId: number;
  licshet: string;
  hybridMailId: string;
  createdOn: Date;
  isCharged: boolean;
  isDeleted: boolean;
  isSent: boolean;
  receiver: string;
  sentOn?: Date;
  type: string;
  isSavedBilling: boolean;
  warning_amount: number;
  sud_process_id_billing?: string;
  warningIdTozamakon?: number;
  warning_date_billing?: Date;
  sud_akt_id?: string;
  abonent_deleted: boolean;
  mahallaId: number;
  companyId: number;
}

export interface IHybridMailDocument extends IHybridMail, Document {
  _id: string;
}

const schema = new Schema<IHybridMail>({
  residentId: {
    required: true,
    type: Number,
  },
  licshet: {
    required: true,
    type: String,
  },
  hybridMailId: String,
  createdOn: Date,
  isCharged: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
  isSent: { type: Boolean, default: false },
  receiver: String,
  sentOn: Date,
  type: String,
  isSavedBilling: { type: Boolean, default: false },
  warning_amount: Number,
  sud_process_id_billing: String,
  warningIdTozamakon: Number,
  warning_date_billing: Date,
  sud_akt_id: {
    type: String,
    default: "",
  },
  abonent_deleted: { type: Boolean, default: false },
  mahallaId: Number,
  companyId: {
    type: Number,
    required: true,
  },
});

export const HybridMail = mongoose.model("hybrid_mail", schema);
