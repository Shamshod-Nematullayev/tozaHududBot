import { Request } from "express";

declare global {
  namespace Express {
    interface Request {
      user: {
        id: string;
        roles: string[];
        companyId: number;
        fullName: string;
        login: string;
        isTestUser?: boolean;
      };
    }
  }
}
