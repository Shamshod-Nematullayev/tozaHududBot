import mongoose from "mongoose";

export const arizaDocumentTypes = [
  "dvaynik",
  "odam_soni",
  "viza",
  "death",
  "gps",
  "pul_kuchirish",
];

const schema = new mongoose.Schema({
  asosiy_licshet: String,
  ikkilamchi_licshet: String,
  needMonayTransferActs: {
    type: Array,
  },
  sana: {
    type: Date,
    required: true,
    default: Date.now,
  },
  document_type: {
    type: String,
    enum: arizaDocumentTypes,
    required: true,
  },
  document_number: {
    required: true,
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
      "qayta_akt_kiritilgan",
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
      "CORRECTED",
    ],
  },
  aktInfo: Object,
  photos: {
    type: Array,
    default: [],
  },
  tempPhotos: {
    type: Array,
    default: [],
  },
  recalculationPeriods: Array,
  muzlatiladi: Boolean,
  actHistory: {
    type: Array,
    default: [],
  },
  companyId: {
    type: Number,
    required: true,
  },
  version: {
    type: Number,
    required: true,
    default: 1,
  },
});
schema.index(
  { companyId: 1, document_number: 1, version: 1, document_type: 1 },
  { unique: true }
);
export const Ariza = mongoose.model("ariza", schema, "arizalar");
