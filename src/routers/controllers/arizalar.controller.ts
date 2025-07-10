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
import { Request, Response } from "express";
import { CreateArizaDto } from "types/ariza.dto";
import { getPagination } from "./utils/pagination";
import { CustomRequest } from "types/express";
import {
  createArizaBodySchema,
  getArizalarQuerySchema,
} from "@schemas/ariza.schema";
import { ZodError } from "zod";

export const getArizalar = async (req: CustomRequest, res: Response) => {
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

export const getArizaById = async (req: CustomRequest, res: Response) => {
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
    ariza.fio = abonent?.fio;
    ariza.abonentId = abonent?.id;
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

export const cancelArizaById = async (req: CustomRequest, res: Response) => {
  try {
    const { _id, canceling_description } = req.body;
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
  } catch (error: any) {
    console.error(error);
    res.json({ ok: false, message: `internal error: ${error.message}` });
  }
};

export const createAriza = async (
  req: Request<{}, {}, CreateArizaDto>,
  res: Response
) => {
  try {
    const parsedBody = createArizaBodySchema.parse(req.body);
    const {
      licshet,
      ikkilamchi_licshet,
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
    if (
      (document_type === "viza" && !akt_summasi.total) ||
      (document_type === "viza" && akt_summasi.total === 0)
    )
      return res.json({
        ok: false,
        message: "Viza arizalariga akt summasi kiritish majburiy!",
      });

    if (document_type === "dvaynik" && !ikkilamchi_licshet)
      return res.json({
        ok: false,
        message: "Ikkilamchi aktlarda dvaynik kod kiritilishi majburiy!",
      });
    if (
      document_type === "death" &&
      next_prescribed_cnt === current_prescribed_cnt &&
      akt_summasi.total === 0
    ) {
      if (!current_prescribed_cnt || !next_prescribed_cnt)
        return res.json({
          ok: false,
          message: "Majburiy qiymatlar kiritilmagan",
        });
    }

    const counter = await Counter.findOne({
      name: "ariza_tartib_raqami",
      companyId: req.user.companyId,
      arizaDocumentType: document_type,
    });
    const newAriza = await Ariza.create({
      licshet: licshet,
      ikkilamchi_licshet: ikkilamchi_licshet,
      asosiy_licshet: licshet,
      document_number: counter.value + 1,
      document_type: document_type,
      comment: comment,
      current_prescribed_cnt: current_prescribed_cnt,
      next_prescribed_cnt: next_prescribed_cnt,
      aktSummasi: parseInt(akt_summasi.total),
      aktSummCounts: akt_summasi,
      sana: Date.now(),
      photos: photos,
      recalculationPeriods: recalculationPeriods,
      muzlatiladi: muzlatiladi,
      companyId: req.user.companyId,
    });
    await counter.updateOne({ $set: { value: counter.value + 1 } });
    res.json({ ok: true, ariza: newAriza });
  } catch (error) {
    console.error(error);
    res.json({ ok: false, message: `internal error: ${error.message}` });
  }
};

export const moveToInboxAriza = async (req, res) => {
  try {
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
  } catch (error) {
    console.error(error);
    res.json({ ok: false, message: `internal error: ${error.message}` });
  }
};

export const updateArizaById = async (req, res) => {
  try {
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
  } catch (error) {
    console.error(error);
    res.json({ ok: false, message: `internal error: ${error.message}` });
  }
};

export const updateArizaFromBillingById = async (req, res) => {
  try {
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
    const tozaMakonApi = createTozaMakonApi(req.user.companyId);
    const acts = (
      await tozaMakonApi.get("/billing-service/acts", {
        params: {
          residentId: abonent.id,
        },
      })
    ).data.content;
    const act = acts.find((a) => a.id == ariza.akt_id);
    const updates = {
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
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ ok: false, message: `internal error: ${error.message}` });
  }
};

export const changeArizaAct = async (req, res) => {
  try {
    const { ariza_id } = req.params;
    const {
      allAmount,
      inhabitantCount,
      amountWithQQS,
      amountWithoutQQS,
      description,
      photos,
    } = req.body;

    if (!allAmount || !amountWithQQS || !amountWithoutQQS || !description) {
      return res
        .status(400)
        .json({ ok: false, message: "All fields are required" });
    }

    let file = req.file;
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

    // PDF va rasmlarni birlashtirish
    if (photos?.length > 0) {
      file = await mergePhotosWithPdf(
        photos,
        req.file,
        ariza.aktInfo.fileId.split("*")[1],
        ariza.companyId
      );
    }

    // Fayl yuklash
    let fileId = file
      ? await uploadFile(file, ariza.document_number, req.user.companyId)
      : ariza.aktInfo.fileId;

    // K-Saldo hisoblash
    const actType = Number(allAmount) > 0 ? "CREDIT" : "DEBIT";
    const kSaldo = await calculateKSaldo(allAmount, ariza, abonent.id, actType);

    // Aktni yangilash yoki yaratish
    const act = await updateOrCreateAct(
      ariza,
      allAmount,
      amountWithQQS,
      amountWithoutQQS,
      description,
      inhabitantCount,
      fileId,
      kSaldo,
      actType,
      abonent.id,
      req
    );

    if (act.code) {
      return res.status(500).json({ ok: false, message: act.message });
    }

    // Arizani yangilash
    const date = new Date();
    const updatedAriza = await Ariza.findByIdAndUpdate(
      ariza._id,
      {
        $set: {
          status: "qayta_akt_kiritilgan",
          actStatus: "NEW",
          akt_pachka_id: act.actPackId,
          akt_id: act.id,
          aktInfo: act,
          akt_date: date,
        },
        $push: { actHistory: ariza.aktInfo },
      },
      { new: true }
    );

    res.json({ ok: true, ariza: updatedAriza });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: "Internal server error" });
  }
};

// PDF va rasm birlashtirish
async function mergePhotosWithPdf(
  photos,
  uploadedFile,
  existingFileId,
  companyId
) {
  const tozaMakonApi = createTozaMakonApi(companyId);
  let imgs = photos.split(",");
  const photosBuffer = await Promise.all(
    imgs.map(async (file_id) => {
      const file = await bot.telegram.getFile(file_id);
      const photoBuffer = await bot.telegram.getFileLink(file.file_id);
      const response = await axios.get(photoBuffer, {
        responseType: "arraybuffer",
      });
      return response.data;
    })
  );

  const pdfDoc = await PDFDocument.create();
  for (let photoBuffer of photosBuffer) {
    const image = await pdfDoc.embedPng(photoBuffer);
    const page = pdfDoc.addPage([image.width, image.height]);
    page.drawImage(image, {
      x: 0,
      y: 0,
      width: image.width,
      height: image.height,
    });
  }

  let pdfBuffer = await pdfDoc.save();
  const merger = new PDFMerger();
  if (uploadedFile?.buffer) {
    await merger.add(uploadedFile.buffer);
  } else {
    const response = await tozaMakonApi.get("/file-service/buckets/download", {
      params: { file: existingFileId },
      responseType: "arraybuffer",
    });
    await merger.add(response.data);
  }

  await merger.add(Buffer.from(pdfBuffer));
  return { buffer: await merger.saveAsBuffer(), originalname: "merged.pdf" };
}

// Fayl yuklash
async function uploadFile(file, documentNumber, companyId) {
  const tozaMakonApi = createTozaMakonApi(companyId);
  const formData = new FormData();
  formData.append("file", file.buffer, file.originalname);
  const fileData = (
    await tozaMakonApi.post("/file-service/buckets/upload", formData, {
      params: { folderType: "ACT" },
    })
  ).data;
  return documentNumber + ".PDF*" + fileData.fileId;
}

// K-Saldo hisoblash
async function calculateKSaldo(amount, ariza, residentId, actType) {
  const tozaMakonApi = createTozaMakonApi(ariza.companyId);
  return (
    await tozaMakonApi.get("/billing-service/acts/calculate-k-saldo", {
      params: {
        amount,
        residentId,
        actPackId: ariza.aktInfo.actPackId,
        actType,
      },
    })
  ).data;
}

// Aktni yangilash yoki yaratish
async function updateOrCreateAct(
  ariza,
  allAmount,
  amountWithQQS,
  amountWithoutQQS,
  description,
  inhabitantCount,
  fileId,
  kSaldo,
  actType,
  residentId,
  req
) {
  const body = {
    actType,
    amount: allAmount,
    amountWithQQS,
    amountWithoutQQS,
    description,
    fileId,
    kSaldo,
    residentId,
  };

  if (inhabitantCount) body.inhabitantCount = inhabitantCount;

  const tozaMakonApi = createTozaMakonApi(ariza.companyId);

  if (ariza.actStatus === "WARNED" || ariza.actStatus === "NEW") {
    return (
      await tozaMakonApi.put(`/billing-service/acts/${ariza.akt_id}`, {
        id: ariza.akt_id,
        ...body,
      })
    ).data;
  } else {
    const packId = (await Company.findOne({ id: req.user.companyId }))
      .akt_pachka_ids;
    const date = new Date();
    return (
      await tozaMakonApi.post("/billing-service/acts", {
        ...body,
        endPeriod: `${date.getMonth() + 1}.${date.getFullYear()}`,
        startPeriod: `${date.getMonth() + 1}.${date.getFullYear()}`,
        actPackId: packId[ariza.document_type].id,
      })
    ).data;
  }
}

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
