import mongoose, { Schema, model } from "mongoose";

const schema = new Schema(
  {
    user: Object,
    data: Object,
    inspector_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    licshet: {
      type: String,
      required: true,
    },
    reUpdating: {
      type: Boolean,
      default: false,
    },
    companyId: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);
export const CustomDataRequest = model("custom_data_request", schema);
