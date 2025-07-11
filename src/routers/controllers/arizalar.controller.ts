import axios from "axios";

import { createTozaMakonApi } from "../../api/tozaMakon";

import { Ariza } from "../../models/Ariza";

import { Abonent } from "@models/Abonent";
import { Company } from "@models/Company";
import { Counter } from "@models/Counter";
import { bot } from "@bot/core/bot";

import { PDFDocument } from "pdf-lib";

import PDFMerger from "pdf-merger-js";
import FormData from "form-data";
import { getOrCreateActPackId } from "@services/billing/getOrCreateActPackId";
import { Handler, Request, Response } from "express";
import { getPagination } from "./utils/pagination";
import {
  cancelArizaByIdSchema,
  changeArizaActBodySchema,
  createArizaBodySchema,
  getArizalarQuerySchema,
} from "@schemas/ariza.schema";
import { ZodError } from "zod";
import {
  calculateKSaldo,
  createAct,
  getActInfo,
  getFileAsBuffer,
  getResidentActs,
  updateAct,
  uploadFileToTozaMakon,
} from "@services/billing";
import { mergePhotosWithPdf } from "./utils/mergePhotosWithPdf";

export const getArizalar = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const parsed = getArizalarQuerySchema.parse(req.query);
    const { skip, limit, sort, meta } = getPagination(parsed);

    const {
      document_type,
      document_number,
      account_number,
      dublicat_account_number,
      created_from_date,
      created_to_date,
      act_from_date,
      act_to_date,
      act_amount_from,
      act_amount_to,
      ariza_status,
      act_status,
    } = parsed;

    // Filtrni dinamik shakllantirish
    const filters: any = { companyId: req.user.companyId };
    if (document_type) filters.document_type = document_type;
    if (document_number) filters.document_number = document_number;
    if (account_number) filters.licshet = account_number;
    if (dublicat_account_number)
      filters.ikkilamchi_licshet = dublicat_account_number;
    if (created_from_date) filters.sana = { $gte: new Date(created_from_date) };
    if (created_to_date)
      filters.sana = {
        ...filters.sana,
        $lte: new Date(created_to_date),
      };
    if (act_from_date) filters.akt_date = { $gte: new Date(act_from_date) };
    if (act_to_date)
      filters.akt_date = { ...filters.akt_date, $lte: new Date(act_to_date) };
    if (act_amount_from) filters.aktSummasi = { $gte: act_amount_from };
    if (act_amount_to)
      filters.aktSummasi = {
        ...filters.aktSummasi,
        $lte: act_amount_to,
      };
    if (ariza_status) filters.status = ariza_status;
    if (act_status) filters.actStatus = act_status;

    // Ma'lumotlarni qidirish
    const data = await Ariza.find(filters).sort(sort).skip(skip).limit(limit);
    const total = await Ariza.countDocuments(filters);

    res.json({
      ok: true,
      data,
      meta: {
        ...meta,
        total,
        totalPages: Math.ceil(total / meta.limit),
      },
    });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        ok: false,
        message: "Invalid query params",
        issues: error.issues, // foydalanuvchi ko'rishi uchun
      });
    }

    res
      .status(500)
      .json({ ok: false, message: `internal error: ${error?.message}` });
  }
};

export const getArizaById = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const ariza = await Ariza.findOne({
      _id: req.params._id,
      companyId: req.user.companyId,
    }).lean();
    if (!ariza)
      return res.status(404).json({
        ok: false,
        message: "Ariza topilmadi",
      });
    const abonent = await Abonent.findOne({ licshet: ariza.licshet });
    if (!abonent)
      return res.status(404).json({ ok: false, message: "Abonent topilmadi" });
    ariza.fio = abonent.fio;
    ariza.abonentId = abonent.id;
    res.json({
      ok: true,
      ariza,
    });
  } catch (error: any) {
    console.error(error);
    res
      .status(500)
      .json({ ok: false, message: `internal error: ${error.message}` });
  }
};

export const cancelArizaById = async (
  req: Request,
  res: Response
): Promise<any> => {
  const { _id, canceling_description } = cancelArizaByIdSchema.parse(req.body);
  const ariza = await Ariza.findOneAndUpdate(
    { _id, companyId: req.user.companyId },
    {
      $set: {
        status: "bekor qilindi",
        canceling_description,
        is_canceled: true,
      },
    }
  );
  if (!ariza)
    return res.status(404).json({
      ok: false,
      message: "Ariza topilmadi",
    });
  res.json({ ok: true, message: "Ariza bekor qilindi" });
};

export const createAriza: Handler = async (
  req: Request,
  res: Response
): Promise<any> => {
  const parsedBody = createArizaBodySchema.parse(req.body);
  const {
    account_number,
    dublicat_account_number,
    document_type,
    akt_summasi,
    current_prescribed_cnt,
    next_prescribed_cnt,
    comment,
    photos,
    recalculationPeriods,
    muzlatiladi,
  } = parsedBody;
  // validate the request

  const counter = await Counter.findOne({
    name: "ariza_tartib_raqami",
    companyId: req.user.companyId,
    arizaDocumentType: document_type,
  });
  if (!counter)
    return res.status(404).json({
      ok: false,
      message: "Ariza tartib raqami topilmadi",
    });
  const newAriza = await Ariza.create({
    licshet: account_number,
    ikkilamchi_licshet: dublicat_account_number,
    asosiy_licshet: account_number,
    document_number: counter.value + 1,
    document_type: document_type,
    comment: comment,
    current_prescribed_cnt: current_prescribed_cnt,
    next_prescribed_cnt: next_prescribed_cnt,
    aktSummasi: akt_summasi.total,
    aktSummCounts: akt_summasi,
    sana: Date.now(),
    photos: photos,
    recalculationPeriods: recalculationPeriods,
    muzlatiladi: muzlatiladi,
    companyId: req.user.companyId,
  });
  await counter.updateOne({ $set: { value: counter.value + 1 } });
  res.json({ ok: true, ariza: newAriza });
};

export const moveToInboxAriza: Handler = async (req, res) => {
  await Ariza.findOneAndUpdate(
    {
      _id: req.params.ariza_id,
      companyId: req.user.companyId,
    },
    {
      $set: {
        acceptedDate: new Date(),
        status: "qabul qilindi",
      },
    }
  );
  res.status(200).json({
    ok: true,
  });
};

export const updateArizaById: Handler = async (req, res) => {
  await Ariza.findOneAndUpdate(
    {
      _id: req.params.ariza_id,
      companyId: req.user.companyId,
    },
    {
      $set: {
        ...req.body,
      },
    },
    { new: true }
  );
  res.status(200).json({
    ok: true,
  });
};

export const updateArizaFromBillingById: Handler = async (
  req,
  res
): Promise<any> => {
  // validate the request
  const ariza = await Ariza.findOne({
    _id: req.params.ariza_id,
    companyId: req.user.companyId,
  });
  if (!ariza)
    return res.status(404).json({
      ok: false,
      message: "Ariza topilmadi",
    });
  const abonent = await Abonent.findOne({ licshet: ariza.licshet });
  if (!abonent)
    return res.status(404).json({ ok: false, message: "Abonent topilmadi" });

  // update the ariza
  const tozaMakonApi = createTozaMakonApi(req.user.companyId);
  const acts = await getResidentActs(tozaMakonApi, abonent.id);
  const act = acts.find((a) => a.id == ariza.akt_id);
  if (!act)
    return res.status(404).json({ ok: false, message: "Act topilmadi" });
  const updates: any = {
    actStatus: act.actStatus,
    aktInfo: act,
  };
  if (act.actStatus === "CONFIRMED") updates.status = "tasdiqlangan";
  const updatedAriza = await Ariza.findByIdAndUpdate(
    ariza._id,
    {
      $set: updates,
    },
    { new: true }
  );

  res.json({
    ok: true,
    ariza: updatedAriza,
  });
};

export const changeArizaAct: Handler = async (req, res): Promise<any> => {
  // validate
  const { ariza_id } = req.params;
  const {
    allAmount,
    inhabitantCount,
    amountWithQQS,
    amountWithoutQQS,
    description,
    photos,
    actNumber,
  } = changeArizaActBodySchema.parse(req.body);

  const tozaMakonApi = createTozaMakonApi(req.user.companyId);
  const ariza = await Ariza.findOne({
    _id: ariza_id,
    companyId: req.user.companyId,
  });
  if (!ariza) {
    return res.status(404).json({ ok: false, message: "Ariza topilmadi" });
  }

  const abonent = await Abonent.findOne({ licshet: ariza.licshet });
  if (!abonent) {
    return res.status(404).json({ ok: false, message: "Abonent topilmadi" });
  }

  // 🖼️ 1. Faylni olish
  let file = req.file?.buffer;
  if (!file)
    file = await getFileAsBuffer(
      tozaMakonApi,
      ariza.aktInfo.fileId.split("*")[1]
    );

  // 🖼️ 2. Agar rasm bo‘lsa — PDFga qo‘shamiz
  if (photos?.length) {
    file = await mergePhotosWithPdf(photos, file);
  }

  // 📤 3. Faylni TozaMakonga yuklash
  let newFileId = ariza.aktInfo.fileId;
  if (req.file || photos?.length) {
    newFileId = await uploadFileToTozaMakon(
      tozaMakonApi,
      file,
      req.file?.originalname || "file.pdf"
    );
  }

  // 4. K-Saldo hisoblash
  const actType = Number(allAmount) > 0 ? "CREDIT" : "DEBIT";
  const kSaldo = await calculateKSaldo(tozaMakonApi, {
    amount: allAmount,
    residentId: abonent.id,
    actPackId: ariza.aktInfo.actPackId,
    actType,
  });

  // 5. Aktni yangilash yoki yaratish
  const date = new Date();
  if (ariza.actStatus === "WARNED" || ariza.actStatus === "NEW") {
    await updateAct(tozaMakonApi, ariza.aktInfo.id, {
      kSaldo,
      amountWithQQS,
      amountWithoutQQS,
      inhabitantCnt: inhabitantCount,
      fileId: newFileId,
      actType,
      actNumber,
      actPackId: ariza.aktInfo.actPackId,
      amount: allAmount,
      description,
      id: ariza.aktInfo.id,
      residentId: abonent.id,
      endPeriod: `${date.getMonth() + 1}.${date.getFullYear()}`,
      startPeriod: `${date.getMonth() + 1}.${date.getFullYear()}`,
    });
  } else {
    ariza.akt_pachka_id = await getOrCreateActPackId(
      ariza.document_type,
      tozaMakonApi,
      req.user.companyId
    );
    ariza.akt_id = await createAct(tozaMakonApi, {
      kSaldo,
      amountWithQQS,
      amountWithoutQQS,
      inhabitantCnt: inhabitantCount,
      fileId: newFileId,
      actType,
      actPackId: ariza.akt_pachka_id,
      amount: allAmount,
      description,
      residentId: abonent.id,
      endPeriod: `${date.getMonth() + 1}.${date.getFullYear()}`,
      startPeriod: `${date.getMonth() + 1}.${date.getFullYear()}`,
    });
    ariza.aktInfo = await getActInfo(tozaMakonApi, ariza.akt_id);
    ariza.actStatus = "NEW";
  }

  ariza.status = "qayta_akt_kiritilgan";
  ariza.akt_date = date;
  ariza.actHistory.push(ariza.aktInfo);

  // Arizani yangilash
  await ariza.save();

  res.json({ ok: true, ariza });
};

export const addImageToAriza = async (req, res) => {
  try {
    const { ariza_id } = req.params;
    const { file_id } = req.body;
    const ariza = await Ariza.findOne({
      _id: ariza_id,
      companyId: req.user.companyId,
    });
    if (!file_id) {
      return res.status(400).json({ ok: false, message: "Fayl ID topilmadi" });
    }
    if (!ariza) {
      return res.status(404).json({ ok: false, message: "Ariza topilmadi" });
    }
    const updatedAriza = await Ariza.findByIdAndUpdate(
      ariza_id,
      { $push: { tempPhotos: file_id } },
      { new: true }
    );
    res.json({ ok: true, message: "Biriktirildi", ariza: updatedAriza });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, message: "Internal server error" });
  }
};

export const createMonayTransferAriza = async (req, res) => {
  try {
    let { debitorAct, creditorActs } = req.body;
    if (
      debitorAct.amount !==
      creditorActs.reduce((total, act) => total + act.amount, 0)
    ) {
      return res.status(400).json({
        ok: false,
        message: "creditor actlar to'plami debitor actga teng bo'lishi kerak",
      });
    }
    if (
      creditorActs.find((a) => a.accountNumber === debitorAct.accountNumber)
    ) {
      return res.status(400).json({
        ok: false,
        message: "creditor actlar ichida debitor abonent bo'lmasligi kerak",
      });
    }
    const counter = await Counter.findOne({
      companyId: req.user.companyId,
      arizaDocumentType: "pul_kuchirish",
      name: "ariza_tartib_raqami",
    });
    const ariza = await Ariza.create({
      licshet: debitorAct.accountNumber,
      document_type: "pul_kuchirish",
      companyId: req.user.companyId,
      document_number: counter.value + 1,
      needMonayTransferActs: creditorActs,
    });
    await counter.updateOne({ $set: { value: counter.value + 1 } });
    res.json({ ok: true, ariza });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, message: "Internal server error" });
  }
};

export const createMonayTransferActByAriza = async (req, res) => {
  try {
    const ariza = await Ariza.findOne({
      _id: req.params._id,
      companyId: req.user.companyId,
    });
    if (!ariza) {
      return res.status(404).json({ ok: false, message: "Ariza topilmadi" });
    }
    const acts = [];
    const tozaMakonApi = createTozaMakonApi(req.user.companyId);
    const formData = new FormData();
    formData.append("file", req.file.buffer, req.file.originalname);
    const fileUploadResponse = (
      await tozaMakonApi.post(
        "/file-service/buckets/upload?folderType=SPECIFIC_ACT",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      )
    ).data;
    const fileId =
      fileUploadResponse.fileName + "*" + fileUploadResponse.fileId;
    const actPackId = await getOrCreateActPackId(
      "pul_kuchirish",
      tozaMakonApi,
      req.user.companyId
    );
    const date = new Date();
    const act = await createMonayTransferAct(ariza, req.user.companyId, req);
    res.json({ ok: true, act });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, message: "Internal server error" });
  }
};
