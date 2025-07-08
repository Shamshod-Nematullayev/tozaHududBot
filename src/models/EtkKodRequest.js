import { Schema, model } from "mongoose";

const schema = new Schema({
  licshet: {
    type: String,
    required: true,
  },
  abonent_id: String,
  etk_kod: {
    type: String,
    required: true,
  },
  etk_saoto: {
    type: String,
    required: true,
  },
  phone: String,
  update_at: Date,
  inspector_id: String,
});

export const EtkKodRequest = model("etk_requests", schema);
