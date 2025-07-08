import { Schema, model } from "mongoose";

const schema = new Schema({
  accountNumber: {
    type: String,
    required: true,
    unique: true,
  },
  customerName: {
    type: String,
    required: true,
  },
  caotoNumber: {
    type: String,
    required: true,
  },
  companyId: {
    type: Number,
    required: true,
  },
});

export const EtkAbonent = model("etk_abonent", schema);
