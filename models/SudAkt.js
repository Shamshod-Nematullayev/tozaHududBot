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
    fio: String,
    case_id: String,
    sud_case_id: String,
    sud_case_number: String,
    judge_name: String,
    davo_summa: Number,
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
        "sudga_ariza_berildi",
        "sud_qarori_chiqorildi",
        "rad_etildi",
      ],
      // default: "yangi",
    },
  },
  {
    timestamps: true,
  }
);

module.exports.SudAkt = mongoose.model("sud_akt", schema);
