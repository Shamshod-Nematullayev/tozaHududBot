import { Mahalla } from "@models/Mahalla.js";
import { Request, Response } from "express";

export const getMahallas = async (req: Request, res: Response) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;
  const data = await Mahalla.find({ companyId: req.user.companyId });
  res.json({ ok: true, data });
};
