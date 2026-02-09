import { Document } from "mongoose";
import { model, Schema } from "mongoose";

export type Role = "admin" | "stm" | "billing" | "yurist" | "gps";
export interface IAdmin {
  user_id: number;
  login: string;
  password: string;
  refreshToken: string;
  fullName: string;
  profilePhotoId: string;
  companyId: number;
  roles: Role[];
  pnfl: string;
  isTestUser: boolean;
}

export interface IAdminDocument extends IAdmin, Document {
  _id: string;
  __v: number;
}

const schema = new Schema<IAdmin>({
  user_id: {
    type: Number,
    required: true,
  },
  login: String,
  password: String,
  refreshToken: String,
  fullName: String,
  profilePhotoId: String,
  companyId: Number,
  roles: {
    type: [String],
    enum: ["billing", "yurist", "admin", "stm", "gps"],
    default: [],
  },
  pnfl: String,
  isTestUser: { type: Boolean, default: false },
});
export const Admin = model("admin", schema, "admin");
