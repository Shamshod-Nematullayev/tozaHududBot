import { Request } from "express";

export interface CustomRequest extends Request {
  user: {
    id: string;
    role: string;
    companyId: number;
  };
}
