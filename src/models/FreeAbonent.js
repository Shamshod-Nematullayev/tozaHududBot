import { Schema, model } from "mongoose";

const schema = new Schema({
  id: {
    type: Number,
    required: true,
  },
  inHabitantCount: {
    type: Number,
    required: true,
  },
  accountNumber: {
    type: String,
    required: true,
  },
  companyId: {
    type: Number,
    required: true,
  },
  inProcess: {
    type: Boolean,
    default: false,
  },
});

export const FreeAbonent = model("free_abonent", schema);
