const { default: mongoose } = require("mongoose");

const schema = new mongoose.Schema({
  asosiy_licshet: String,
  ikkilamchi_licshet: String,
  sana: Date,
  document_type: {
    type: String,
    enum: ["dvaynik", "odam_soni", "viza", "death"],
    required: true,
  },
  document_number: {
    required: true,
    unique: true,
    type: Number,
  },
  licshet: {
    type: String,
    required: true,
  },
  comment: {
    type: String,
    default: "",
  },
  aktSummasi: {
    type: Number,
    default: 0,
  },
  current_prescribed_cnt: {
    type: Number,
  },
  next_prescribed_cnt: {
    type: Number,
  },
  status: {
    type: String,
    enum: ["yangi", "qabul qilindi", "tasdiqlangan", "bekor qilindi"],
    default: "yangi",
  },
  akt_statuses_name: {
    type: String,
    enum: [
      "",
      "Tasdiqlangan bekor qilindi",
      "Yangi",
      "Камчилик тўғирланди",
      "Огоҳлантирилди",
      "Tasdiqlandi",
    ],
    default: "",
  },
  is_canceled: {
    type: Boolean,
    default: false,
  },
  canceling_description: String,
  akt_date: Date,
  akt_pachka_id: String,
  akt_id: String,
  aktInfo: Object,
});
module.exports.Ariza = mongoose.model("ariza", schema, "arizalar");
