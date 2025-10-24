import { createTozaMakonApi } from "@api/tozaMakon.js";
import { DalolatnomaGPS } from "@models/DalolatnomaGPS.js";
import {
  createGPSDalolatnomaBodySchema,
  getGPSDalolatnomalarQuerySchema,
} from "@schemas/gps.schema.js";
import { getCarsFromTozamakon } from "@services/gps/getCarsFromTozamakon.js";
import { Handler } from "express";

export const getCars: Handler = async (req, res) => {
  const tozaMakonApi = createTozaMakonApi(req.user.companyId, "gps");

  const data = await getCarsFromTozamakon(tozaMakonApi, {
    companyId: req.user.companyId,
  });

  res.json({
    ok: true,
    data: data.content,
    meta: {
      total: data.totalElements,
      page: data.number,
      limit: data.size,
    },
  });
};

export const createGPSDalolatnoma: Handler = async (req, res) => {
  const { content, currentCarId, date, participants, responsibleCarId } =
    createGPSDalolatnomaBodySchema.parse(req.body);

  const getLastDalolatnoma = await DalolatnomaGPS.find({
    companyId: req.user.companyId,
  })
    .sort({ documentNumber: -1 })
    .limit(1);

  const dalolatnoma = await DalolatnomaGPS.create({
    content,
    currentCarId,
    date,
    participants,
    responsibleCarId,
    documentNumber: getLastDalolatnoma[0]?.documentNumber + 1 || 1,
  });

  res.json({ ok: true, data: dalolatnoma });
};

export const getGPSDalolatnomalar: Handler = async (req, res) => {
  const { page, filters, sortDirection, limit, sortField } =
    getGPSDalolatnomalarQuerySchema.parse(req.query);

  const skip = (page - 1) * limit;
  const data = await DalolatnomaGPS.find({
    companyId: req.user.companyId,
    ...filters,
  })
    .skip(skip)
    .limit(limit)
    .sort({ [sortField]: sortDirection });
  res.json({ ok: true, data });
};

export const getOneGPSDalolatnomaById: Handler = async (req, res) => {
  const { id } = req.params;
  const data = await DalolatnomaGPS.findById(id);
  if (!data) {
    res.status(404).json({ ok: false, message: "Not found" });
    return;
  }
  res.json({ ok: true, data });
};
