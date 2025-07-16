import mongoose from "mongoose";
import { Counter } from "./Counter.js";

const schema = new mongoose.Schema({
  user: Object,
  file_id: String,
  file_name: String,
  inspector: Object,
  date: Date,
  abonent: Number,
  abonents: Array,
  doc_num: Number,
  doc_type: String,
  comment: String,
  companyId: {
    type: Number,
    required: true,
  },
});

export const IncomingDocument = mongoose.model("IncomingDocument", schema);
