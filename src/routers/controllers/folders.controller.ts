import NotFoundError from "@errors/NotFoundError.js";
import { Ariza } from "@models/Ariza.js";
import { Folder } from "@models/Folder.js";
import { Handler } from "express";
import z from "zod";

export const getFolders: Handler = async (req, res) => {
  const { page, limit, sortField, sortDirection, filters } = z
    .object({
      page: z.coerce.number().optional().default(1),
      limit: z.coerce.number().optional().default(10),
      sortField: z
        .enum(["startingAt", "endingAt", "id"])
        .optional()
        .default("startingAt"),
      sortDirection: z.enum(["asc", "desc"]).optional().default("desc"),
      filters: z.object().optional(),
    })
    .parse(req.query);

  const skip = (page - 1) * limit;
  const folders = await Folder.find({
    companyId: req.user.companyId,
    ...filters,
  })
    .skip(skip)
    .limit(limit)
    .sort({ [sortField]: sortDirection })
    .lean();

  const data = folders.map((folder) => {
    return {
      id: folder.id,
      type: folder.type,
      startingAt: folder.startingAt,
      endingAt: folder.endingAt,
      _id: folder._id,
      elementsCount: folder.elements.length,
    };
  });

  const total = await Folder.countDocuments({
    companyId: req.user.companyId,
    ...filters,
  });

  res.json({ ok: true, data, meta: { page, limit, total } });
};

export const getFolderById: Handler = async (req, res) => {
  const { folderId } = z.object({ folderId: z.string() }).parse(req.params);

  const folder = await Folder.findById(folderId).lean();
  res.json({ ok: true, data: folder });
};

export const closeFolder: Handler = async (req, res) => {
  const { folderId } = z.object({ folderId: z.string() }).parse(req.body);
  await Folder.closeFolder(folderId);
  const folder = await Folder.findById(folderId).lean();
  res.json({ ok: true, data: folder });
};

export const addArizaToFolder: Handler = async (req, res): Promise<any> => {
  const { ariza_id } = z.object({ ariza_id: z.string() }).parse(req.body);

  const ariza = await Ariza.findById(ariza_id);
  if (!ariza) throw new NotFoundError("Ariza");

  await Folder.addArizaToFolder(req.user.companyId, {
    accountNumber: ariza?.licshet,
    ariza_id: ariza_id,
    arizaNumber: ariza.document_number,
    arizaType: ariza.document_type,
  });

  res.json({ ok: true });
};
