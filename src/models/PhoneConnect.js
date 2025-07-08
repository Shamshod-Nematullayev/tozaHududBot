import { Schema, model } from "mongoose";

const schema = new Schema({
  KOD: Number,
  phone: String,
  needSMS: Boolean,
  from: Object,
});

export const PhoneConnect = model("phone_connect", schema);
