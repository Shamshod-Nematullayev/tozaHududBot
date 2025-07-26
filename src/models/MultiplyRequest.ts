import mongoose from "mongoose";

export interface IMultiplyRequest {
  KOD: number;
  YASHOVCHILAR: number;
  currentInhabitantCount: number;
  date: Date;
  from: {
    id: number;
    first_name: string;
    user_name: string;
  };
  confirm: boolean;
  mahallaId: string;
  abonentId: string;
  mahallaName: string;
  fio: string;
  actId: string;
  document_id: string;
  isCancel: boolean;
  companyId: number;
}

const schema = new mongoose.Schema<IMultiplyRequest>({
  KOD: {
    type: Number,
    required: true,
    immutable: true,
  },
  YASHOVCHILAR: {
    type: Number,
    required: true,
    immutable: true,
  },
  currentInhabitantCount: Number,
  date: Date,
  from: {
    type: Object,
    required: true,
    immutable: true,
  },
  confirm: {
    type: Boolean,
    default: false,
    required: true,
  },
  mahallaId: String,
  abonentId: {
    type: String,
    required: true,
    immutable: true,
  },
  mahallaName: String,
  fio: String,
  actId: String,
  document_id: String,
  isCancel: {
    type: Boolean,
    default: false,
  },
  companyId: {
    type: Number,
    required: true,
  },
});

export const MultiplyRequest = mongoose.model("multipy_request", schema);
