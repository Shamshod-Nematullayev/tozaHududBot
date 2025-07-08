import mongoose, { Document, Schema, model } from "mongoose";

export interface ICustomDataRequest {
  user: {
    id: string;
    username: string;
  };
  data: {
    pinfl: string;
    passport_serial: string;
    passport_number: string;
    birth_date: string;
    last_name: string;
    first_name: string;
    middle_name: string;
  };
  inspector_id: string;
  licshet: string;
  reUpdating: boolean;
  companyId: number;
}

export interface ICustomDataRequestDoc extends ICustomDataRequest, Document {}

const schema = new Schema<ICustomDataRequestDoc>(
  {
    user: Object,
    data: Object,
    inspector_id: {
      type: String,
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
