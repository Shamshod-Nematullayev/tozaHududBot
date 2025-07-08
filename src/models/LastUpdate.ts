import { model, Schema } from "mongoose";

export const LastUpdate = model(
  "LastUpdate",
  new Schema({
    key: String,
    rows: Array,
    last_update: Date,
    page: Number,
  })
);
