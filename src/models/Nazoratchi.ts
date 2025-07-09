import { model, Schema } from "mongoose";

export interface INazoratchi {
  id: number;
  name: string;
  nowUser: string;
  activ: boolean;
  biriktirilgan: string[];
  telegram_id: number[];
  dontShowOnReport: boolean;
  shaxs_tasdiqlash_ball: number;
  companyId: number;
  isXatlovchi: boolean;
}

const schema = new Schema<INazoratchi>({
  id: {
    type: Number,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },

  nowUser: String,
  activ: {
    type: Boolean,
    default: true,
  },
  biriktirilgan: Array,
  telegram_id: {
    type: Array(Number),
    default: [],
  },
  dontShowOnReport: {
    type: Boolean,
    default: false,
  },
  shaxs_tasdiqlash_ball: { type: Number, default: 0 },
  companyId: {
    type: Number,
    required: true,
  },
  isXatlovchi: Boolean,
});

export const Nazoratchi = model("inpektor", schema);
