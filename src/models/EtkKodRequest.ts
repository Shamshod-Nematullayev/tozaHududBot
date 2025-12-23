import { Schema, model } from "mongoose";

type EtkKodStatus = "yangi" | "tasdiqlandi" | "bekor_qilindi";

interface IEtkKodRequest {
  licshet: string;
  abonent_id: number;
  etk_kod: string;
  etk_saoto: string;
  phone: string;
  update_at: Date;
  inspector_id: string;
  status: EtkKodStatus;
  companyId: number;
  address: string;
  fio: string;
  channelPostId: number;
  existingAbonents: string[];
  billingdaFIO: string;
}

const schema = new Schema<IEtkKodRequest>({
  licshet: {
    type: String,
    required: true,
  },
  abonent_id: {
    type: Number,
    required: true,
  },
  etk_kod: {
    type: String,
    required: true,
  },
  etk_saoto: {
    type: String,
    required: true,
  },
  inspector_id: String,
  status: {
    type: String,
    enum: ["yangi", "tasdiqlandi", "bekor_qilindi"],
    default: "yangi",
  },
  companyId: {
    type: Number,
    required: true,
  },
  phone: String,
  address: {
    type: String,
    required: true,
  },
  fio: {
    type: String,
    required: true,
  },
  channelPostId: {
    type: Number,
  },
  existingAbonents: {
    type: Array(String),
  },
  billingdaFIO: {
    type: String,
    required: true,
  },
});

export const EtkKodRequest = model("etk_requests", schema);
