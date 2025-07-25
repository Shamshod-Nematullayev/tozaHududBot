import { model, Schema } from "mongoose";

interface IOldAbonent {
  fullName: string;
  accountNumber: string;
  id: number;
  mahallaId: number;
  companyId: number;
}

const schema = new Schema<IOldAbonent>({
  fullName: {
    type: String,
    required: true,
  },
  accountNumber: {
    type: String,
    required: true,
  },
  id: {
    type: Number,
    required: true,
  },
  mahallaId: {
    type: Number,
    required: true,
  },
  companyId: {
    type: Number,
    required: true,
  },
});

export const OldAbonent = model("oldAbonent", schema, "oldAbonents");
