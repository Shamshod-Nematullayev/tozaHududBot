import mongoose from "mongoose";

const schema = new mongoose.Schema({
  mahallaId: {
    type: Number,
    required: true,
  },
  request_ids: {
    type: Array,
    default: [],
    required: true,
  },
  date: Date,
  documentNumber: Number,
  isCancel: Boolean,
  cancelDescription: String,
  cancelDate: Date,
  companyId: {
    type: Number,
    required: true,
  },
});

schema.index({ documentNumber: 1, companyId: 1 }, { unique: true });

export const XatlovDocument = mongoose.model("xatlov_document", schema);
