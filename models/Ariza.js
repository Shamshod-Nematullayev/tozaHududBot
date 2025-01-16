const { default: mongoose } = require("mongoose");

const schema = new mongoose.Schema({
  asosiy_licshet: String,
  ikkilamchi_licshet: String,
  sana: {
    type: Date,
    required: true,
    default: Date.now,
  },
  document_type: {
    type: String,
    enum: ["dvaynik", "odam_soni", "viza", "death", "gps"],
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
    unique: true,
  },
  comment: {
    type: String,
    default: "",
  },
  aktSummasi: {
    type: Number,
    default: 0,
  },
  aktSummCounts: {
    type: Object,
    default: {
      total: 0,
    },
  },
  current_prescribed_cnt: {
    type: Number,
  },
  next_prescribed_cnt: {
    type: Number,
  },
  status: {
    type: String,
    enum: [
      "yangi",
      "qabul qilindi",
      "tasdiqlangan",
      "bekor qilindi",
      "akt_kiritilgan",
    ],
    default: "yangi",
  },
  is_canceled: {
    type: Boolean,
    default: false,
  },
  acceptedDate: Date,
  canceling_description: String,
  akt_date: Date,
  akt_pachka_id: String,
  akt_id: String,
  actStatus: {
    type: String,
    enum: [
      "NEW",
      "WARNED",
      "CONFIRMED",
      "CANCELLED",
      "CONFIRMED_CANCELLED",
      "WARNED_CANCELLED",
      "APPROVED",
    ],
    default: "NEW",
  },
  aktInfo: Object,
  photos: {
    type: Array,
    default: [],
  },
  recalculationPeriods: Array,
  muzlatiladi: Boolean,
});
module.exports.Ariza = mongoose.model("ariza", schema, "arizalar");
