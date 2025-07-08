import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    elements: {
      type: Array,
      default: [],
    },
  },
  { timestamps: true }
);
export const EnterWarningLettersModel = mongoose.model(
  "entering_warning_letters_pack",
  schema
);
