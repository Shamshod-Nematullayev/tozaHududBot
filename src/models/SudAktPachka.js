import mongoose from "mongoose";

const schema = mongoose.Schema(
  {
    name: String,
    description: String,
    elements: {
      type: Array,
      default: [],
    },
    sended_sud_time: Date,
    sended_sud: { type: Boolean, default: false },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const SudAktPachka = mongoose.model("sud_akt_pachka", schema);
