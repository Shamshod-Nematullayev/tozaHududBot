import mongoose from "mongoose";

const schema = new mongoose.Schema({
  user: Object,
  level: Number,
  job: String,
  nazoratchiQilingan: {
    type: Boolean,
    default: false,
  },
  is_stm_xodimi: {
    type: Boolean,
    default: false,
  },
  created: Date,
});

export const User = mongoose.model("user", schema);
