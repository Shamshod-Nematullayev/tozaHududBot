import { Document } from "mongoose";
import { model, Schema } from "mongoose";

export interface IAdmin {
  user_id: number;
  login: string;
  password: string;
  refreshToken: string;
  fullName: string;
  profilePhotoId: string;
  companyId: number;
  roles: string[];
  pnfl: string;
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
    enum: ["billing", "yurist", "admin", "stm"],
    default: [],
  },
  pnfl: String,
});
export const Admin = model("admin", schema, "admin");
