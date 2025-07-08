import { Schema, model } from "mongoose";

const schema = new Schema({
  licshet: String,
  date: Date,
  pinfl: String,
  document_number: Number,
  type: {
    type: String,
    enum: ["prokuror", "ss_palata"],
  },
  qarzdorlik_summa: Number,
  qarzdor_fio: String,
});

export const ArizaSud = model("sud_arizan", schema, "sud_arizalar");
