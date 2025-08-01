import mongoose from "mongoose";

interface ISudAkt {
  reg_number: number;
  licshet: string;
  mfy_id: number;
  mfy_name: string;
  sud_process_id_billing: string;
  sud_process_status: string;
  case_current_status: string;
  fio: string;
  case_id: string;
  sud_case_id: string;
  sud_case_number: string;
  judge_name: string;
  claimAmount: number;
  sudQaroriBillinggaYuklandi: boolean;
  warningDate: Date;
  case_documents: any[];
  ariza_date: Date;
  ariza_order_num: number;
  ariza_type: "prokuratura" | "savdo-sanoat";
  ariza_file_name: string;
  ariza_file_id: string;
  tushum: number;
  akt: number;
  isDelete: boolean;
  pinfl: number;
  abonentId: number;
  status:
    | "yangi"
    | "ariza_yaratildi"
    | "ariza_imzolandi"
    | "sudga_ariza_berildi"
    | "sud_qarori_chiqorildi"
    | "rad_etildi";
  companyId: number;
  yakunlandiDate: Date;
}

const schema = new mongoose.Schema<ISudAkt>(
  {
    reg_number: Number,
    licshet: String,
    mfy_id: Number,
    mfy_name: String,
    sud_process_id_billing: String,
    sud_process_status: String,
    case_current_status: String,
    fio: String,
    case_id: String,
    sud_case_id: String,
    sud_case_number: String,
    judge_name: String,
    claimAmount: Number,
    sudQaroriBillinggaYuklandi: {
      type: Boolean,
      defalt: false,
    },
    warningDate: Date,
    case_documents: Array,
    ariza_date: Date,
    ariza_order_num: Number,
    ariza_type: {
      type: String,
      enum: ["prokuratura", "savdo-sanoat"],
    },
    ariza_file_name: String,
    ariza_file_id: String,
    tushum: {
      type: Number,
      default: 0,
    },
    akt: {
      type: Number,
      default: 0,
    },
    isDelete: {
      type: Boolean,
      default: false,
    },
    pinfl: Number,
    status: {
      type: String,
      enum: [
        "yangi",
        "ariza_yaratildi",
        "ariza_imzolandi",
        "sudga_ariza_berildi",
        "sud_qarori_chiqorildi",
        "rad_etildi",
        "yakunlandi",
      ],
    },
    companyId: {
      type: Number,
      required: true,
    },
    yakunlandiDate: Date,
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const SudAkt = mongoose.model("sud_akt", schema);
