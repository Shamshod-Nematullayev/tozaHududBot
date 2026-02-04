import { Mahalla } from "@models/Mahalla.js";
import { getMahallasQuerySchema } from "@schemas/mahalla.schema.js";
import { Request, Response } from "express";

export const getMahallas = async (req: Request, res: Response) => {
  const {
    page = 1,
    limit = 10,
    sortDirection,
    sortField,
    ...filterParams
  } = getMahallasQuerySchema.parse(req.query);
  const skip = (Number(page) - 1) * Number(limit);
  const filters: any = { companyId: req.user.companyId };
  if (filterParams.id) filters.id = filterParams.id;
  let sortOptions: any = {};
  if (sortField) sortOptions[sortField] = sortDirection === "asc" ? 1 : -1;

  const data = await Mahalla.find(filters)
    .skip(skip)
    .limit(Number(limit))
    .sort(sortOptions);
  res.json({ ok: true, data });
};
