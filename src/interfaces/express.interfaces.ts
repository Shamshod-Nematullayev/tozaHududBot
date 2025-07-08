import { Request } from "express";

interface MyRequest extends Request {
  user?: {
    companyId: number;
    id: string;
    roles: string[];
  };
}

export { MyRequest };
