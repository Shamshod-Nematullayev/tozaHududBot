import mongoose from "mongoose";

// Viloyatdagi har bir tuman uchun reja belgilash
const schema = new mongoose.Schema({
  ID: Number,
  name: String,
  monthly_plan: Object,
});
export const Hudud = mongoose.model("hudud", schema, "hududlar");
