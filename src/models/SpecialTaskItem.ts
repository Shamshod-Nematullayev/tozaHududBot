import { model, Schema } from "mongoose";

interface SpecialTaskItem {
  accountNumber: string;
  fullName: string;
  id: number;
  mahallaId: number;
  companyId: number;
  type: "phone" | "electricity";
  nazoratchi_id: string;
  nazoratchiName: string;
  status: "completed" | "in-progress" | "rejected";
  purpose: string;
  complatedDate: Date;
}

const schema = new Schema<SpecialTaskItem>({
  accountNumber: {
    type: String,
    required: true,
  },
  fullName: {
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
  type: {
    type: String,
    required: true,
  },
  nazoratchi_id: {
    type: String,
    required: true,
  },
  nazoratchiName: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    required: true,
    enum: ["completed", "in-progress", "rejected"],
    default: "in-progress",
  },
  purpose: String,
  complatedDate: Date,
});

export const SpecialTaskItem = model("special_task_item", schema);
