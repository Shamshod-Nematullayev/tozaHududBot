const { default: mongoose } = require("mongoose");

const schema = new mongoose.Schema(
  {
    "№": String,
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
    tushum: Number,
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
      ],
    },
  },
  {
    timestamps: true,
  }
);

module.exports.SudAkt = mongoose.model("sud_akt", schema);
