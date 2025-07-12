import PDFMerger from "pdf-merger-js";
import { createTozaMakonApi } from "../../api/tozaMakon";

import { Abonent } from "@models/Abonent";

import { Ariza } from "@models/Ariza";

import { bot } from "@bot/core/bot";
import { Company } from "@models/Company";

import { Mahalla } from "@models/Mahalla";

import Excel from "exceljs";

import {
  uploadFileToTozaMakon,
  getOrCreateActPackId,
  calculateAmount,
  calculateKSaldo,
  createAct,
  deleteActById,
  getFileAsBuffer,
  getResidentDHJByAbonentId,
  getResidentActs,
  getActInfo,
  ICreateActPayload,
  getAbonentDetails,
  getActPacks,
} from "@services/billing";
import { Request, response, Response } from "express";
import z from "zod";
import {
  createDublicateActBodySchema,
  createResidentActBodySchema,
  getAbonentDataRowIdQuerySchema,
  getAbonentsByMfyIdQuerySchema,
  sendAbonentsListToTelegramQuerySchema,
} from "@schemas/billing.schema";
import { mergePhotosWithPdf } from "./utils/mergePhotosWithPdf";
import { transferAmountBetweenAccounts } from "@services/billing/transferAmountBetweenAccounts";
import { InputMediaDocument } from "telegraf/typings/core/types/typegram";
import { chunkArray } from "helpers/chunkArray";
import { generateMessageForAbonentList } from "./utils/generateMessageForAbonentList";
import { getAbonentsByMfyId } from "./utils/getAbonensByMfyId";
import { createMoneyTransferActs } from "@services/billing/createMoneyTransferActs";

export const downloadPdfFileFromBillingAsBase64 = async (
  req: Request,
  res: Response
) => {
  const tozaMakonApi = createTozaMakonApi(req.user.companyId);
  // 1. inputlarni olish
  const { file_id } = z.parse(
    z.object({
      file_id: z.string().regex(/.*\*.*/, "Invalid file_id format"),
    }),
    req.query
  );
  const cleanFileId = file_id.split("*").pop() as string; // "filaname*fileId" => "fileId"

  // 2. faylni yuklab olish
  const buffer = await getFileAsBuffer(tozaMakonApi, cleanFileId);

  // 3. Faylni Base64 ga o'tkazish
  const base64Data = buffer.toString("base64");

  // 4. javob qaytarish
  res.json({
    ok: true,
    file: `data:application/pdf;base64,${base64Data}`,
  });
};

export const getAbonentDHJByAbonentId = async (req: Request, res: Response) => {
  // 1. inputlarni olish
  const tozaMakonApi = createTozaMakonApi(req.user.companyId);
  const { residentId } = getAbonentDataRowIdQuerySchema.parse(req.query);

  // 2. ma'lumotlarni olish
  const data = await getResidentDHJByAbonentId(tozaMakonApi, residentId);

  // 2. javob qaytarish
  res.json({
    ok: true,
    rows: data,
  });
};

export const getAbonentActs = async (req: Request, res: Response) => {
  const tozaMakonApi = createTozaMakonApi(req.user.companyId);
  const { residentId } = getAbonentDataRowIdQuerySchema.parse(req.query);
  const rows = await getResidentActs(tozaMakonApi, residentId);
  res.json({
    ok: true,
    rows,
  });
};

export const createResidentAct = async (
  req: Request,
  res: Response
): Promise<any> => {
  const {
    next_inhabitant_count,
    akt_sum,
    licshet,
    amountWithoutQQS,
    document_type,
    description,
    ariza_id,
    photos,
  } = createResidentActBodySchema.parse(req.body);

  const companyId = req.user.companyId;
  const date = new Date();

  const abonent = await Abonent.findOne({ licshet, companyId });
  if (!abonent) {
    return res.status(404).json({
      ok: false,
      message: "Abonent topilmadi",
    });
  }

  if (!req.file?.buffer) {
    return res.status(400).json({
      ok: false,
      message: "Faylni yuklang",
    });
  }

  // 🖼️ 1. Agar rasm bo‘lsa — PDFga qo‘shamiz
  if (photos?.length) {
    req.file.buffer = await mergePhotosWithPdf(photos, req.file.buffer);
  }

  // 📎 2. Faylni Telegramga yuklaymiz bu qism ishlatilmayotganligi sababli olib tashlandi
  // 📄 3. Incoming Document yaratish bu qism ishlatilmayotganligi sababli olib tashlandi

  // 📤 4. Faylni TozaMakon APIga yuklash
  const tozaMakonApi = createTozaMakonApi(companyId);
  const fileId = await uploadFileToTozaMakon(
    tozaMakonApi,
    req.file.buffer,
    req.file.originalname,
    "SPECIFIC_ACT"
  );

  // 📦 5. Akt Pachkasini olish
  const actPackId = await getOrCreateActPackId(
    document_type,
    tozaMakonApi,
    companyId
  );

  // 📊 6. kSaldo hisoblash
  const kSaldo = await calculateKSaldo(tozaMakonApi, {
    amount: Math.abs(akt_sum),
    residentId: abonent.id,
    actPackId,
    actType: akt_sum < 0 ? "DEBIT" : "CREDIT",
  });

  // 📌 7. Aktni yaratish
  const aktPayload: ICreateActPayload = {
    actPackId,
    actType: akt_sum < 0 ? "DEBIT" : "CREDIT",
    amount: Number(akt_sum),
    amountWithQQS: Number(akt_sum) - (Number(amountWithoutQQS) || 0),
    amountWithoutQQS: Number(amountWithoutQQS) || 0,
    description,
    endPeriod: `${date.getMonth() + 1}.${date.getFullYear()}`,
    startPeriod: `${date.getMonth() + 1}.${date.getFullYear()}`,
    fileId,
    kSaldo,
    residentId: abonent.id,
    inhabitantCount: next_inhabitant_count,
  };

  const actId = await createAct(tozaMakonApi, aktPayload);
  const actInfo = await getActInfo(tozaMakonApi, actId);

  // Agar ariza bo'lsa akt ma'lumotlari yozib qolinadi
  if (ariza_id) {
    await Ariza.findByIdAndUpdate(ariza_id, {
      $set: {
        status: "akt_kiritilgan",
        akt_pachka_id: actPackId,
        akt_id: actId,
        aktInfo: actInfo,
        akt_date: actInfo.createdAt,
      },
    });
  }

  return res.json({ ok: true, message: "Akt muvaffaqqiyatli qo‘shildi" });
};

export const duplicateActFromRequest = async (
  req: Request,
  res: Response
): Promise<any> => {
  const { ariza_id, akt_sum } = req.body;

  const ariza = await Ariza.findById(ariza_id);

  if (!ariza) {
    return res.status(404).json({ ok: false, message: "Ariza topilmadi" });
  }

  if (!req.file?.buffer) {
    return res.status(400).json({
      ok: false,
      message: "Faylni yuklang",
    });
  }

  const companyId = req.user.companyId;

  const abonentReal = await Abonent.findOne({
    licshet: ariza.licshet,
    companyId,
  });
  const abonentFake = await Abonent.findOne({
    licshet: ariza.ikkilamchi_licshet,
    companyId,
  });

  if (!abonentReal || !abonentFake) {
    return res.status(404).json({
      ok: false,
      message: "Abonentlar topilmadi",
    });
  }

  const tozaMakonApi = createTozaMakonApi(companyId);

  // 1. Faylni TozaMakon APIga yuklash
  const fileId = await uploadFileToTozaMakon(
    tozaMakonApi,
    req.file.buffer,
    req.file.originalname,
    "SPECIFIC_ACT"
  );

  // 2. Akt pachkalarini olish
  const pulKuchirishPackId = await getOrCreateActPackId(
    "pul_kuchirish",
    tozaMakonApi,
    companyId
  );
  const dvaynikPackId = await getOrCreateActPackId(
    "dvaynik",
    tozaMakonApi,
    companyId
  );

  // 3. Pul ko‘chirish aktlarini yaratish
  if (Number(akt_sum))
    await transferAmountBetweenAccounts(tozaMakonApi, {
      amount: Number(akt_sum),
      residentFrom: abonentFake.id,
      residentTo: abonentReal.id,
      actPackId: pulKuchirishPackId,
      fileId,
      descriptionPrefix: `${abonentFake.licshet} → ${abonentReal.licshet}`,
    });

  // 4. Dvaynikni yopish
  const amountObj = await calculateAmount(tozaMakonApi, {
    residentId: abonentFake.id,
    inhabitantCount: 0,
    kSaldo: 0,
  });

  const dvaynikActID = await createAct(tozaMakonApi, {
    actPackId: dvaynikPackId,
    actType: "CREDIT",
    amount: Number(amountObj.amount) + Number(akt_sum),
    amountWithQQS: 0,
    amountWithoutQQS: Number(amountObj.amount) + Number(akt_sum),
    description: "ikkilamchi hisob raqamini o'chirish",
    endPeriod: `${new Date().getMonth() + 1}.${new Date().getFullYear()}`,
    startPeriod: `${new Date().getMonth() + 1}.${new Date().getFullYear()}`,
    fileId,
    kSaldo: 0,
    residentId: abonentFake.id,
    inhabitantCount: 0,
  });
  const dvaynikAct = await getActInfo(tozaMakonApi, dvaynikActID);

  // 5. Arizani yangilash
  await ariza.updateOne({
    $set: {
      status: "akt_kiritilgan",
      akt_pachka_id: dvaynikPackId,
      akt_id: dvaynikActID,
      aktInfo: dvaynikAct,
      akt_date: new Date(),
    },
  });

  res.json({ ok: true, message: "Aktlar muvaffaqiyatli yaratildi" });
};

export const getActiveMfy = async (req: Request, res: Response) => {
  const data = await Mahalla.find({
    reja: { $gt: 0 },
    companyId: req.user.companyId,
  });
  const mahallalar = data.map((mfy) => {
    return { id: mfy.id, name: mfy.name, printed: mfy.abarotka_berildi };
  });
  mahallalar.sort((a, b) => a.name.localeCompare(b.name));
  res.json({ ok: true, data: mahallalar });
};

export const createDublicateAct = async (
  req: Request,
  res: Response
): Promise<any> => {
  // inputlarni olish
  const { realAccountNumber, fakeAccountNumber, fakeAccountIncomeAmount } =
    createDublicateActBodySchema.parse(req.body);

  const tozaMakonApi = createTozaMakonApi(req.user.companyId);
  const date = new Date();
  const abonentReal = await Abonent.findOne({ licshet: realAccountNumber });
  const abonentFake = await Abonent.findOne({ licshet: fakeAccountNumber });

  if (!abonentReal || !abonentFake) {
    return res.status(404).json({
      ok: false,
      message: "Abonentlar topilmadi",
    });
  }
  if (!req.file) {
    return res.status(404).json({
      ok: false,
      message: "Fayl kiriting",
    });
  }

  // 1. 📎 Faylni TozaMakonga yuklash
  const fileId = await uploadFileToTozaMakon(
    tozaMakonApi,
    req.file.buffer,
    req.file.originalname,
    "SPECIFIC_ACT"
  );

  // 2. 📁 Akt pachkalarini olish
  const pulKochirishPackId = await getOrCreateActPackId(
    "pul_kuchirish",
    tozaMakonApi,
    req.user.companyId
  );
  const dvaynikPackId = await getOrCreateActPackId(
    "dvaynik",
    tozaMakonApi,
    req.user.companyId
  );

  // 3. 💸 Agar to'lovlar bo'lsa pul ko'chirish
  if (fakeAccountIncomeAmount > 0) {
    await transferAmountBetweenAccounts(tozaMakonApi, {
      amount: fakeAccountIncomeAmount,
      residentFrom: abonentFake.id,
      residentTo: abonentReal.id,
      actPackId: pulKochirishPackId,
      fileId,
    });
  }
  // 4. Ikkilamchi hisob raqamni o'chirish
  const amountObj = await calculateAmount(tozaMakonApi, {
    residentId: abonentFake.id,
    inhabitantCount: 0,
    kSaldo: 0,
  });
  await createAct(tozaMakonApi, {
    actPackId: dvaynikPackId,
    actType: amountObj.actType,
    amount: amountObj.amount,
    amountWithQQS: amountObj.amountWithQQS,
    amountWithoutQQS: amountObj.amountWithoutQQS,
    description: "ikkilamchi hisob raqamini o'chirish",
    endPeriod: `${date.getMonth() + 1}.${date.getFullYear()}`,
    startPeriod: `${date.getMonth() + 1}.${date.getFullYear()}`,
    fileId,
    kSaldo: 0,
    residentId: abonentFake.id,
    inhabitantCount: 0,
  });

  return res.json({
    ok: true,
    message: "muvaffaqqiyatli akt qilindi",
  });
};

export const sendAbonentsListToTelegram = async (
  req: Request,
  res: Response
): Promise<any> => {
  let { minSaldo, maxSaldo, identified, etkStatus, mahalla_name } =
    sendAbonentsListToTelegramQuerySchema.parse(req.query);
  const files = req.files;

  const company = await Company.findOne({ id: req.user.companyId });
  if (!company) {
    return res.status(404).send("Company topilmadi!");
  }

  if (!files || files.length === 0 || !Array.isArray(files)) {
    return res.status(400).send("Hech qanday fayl yuklanmadi!");
  }

  // Yuklangan fayllarni Telegram media group formatiga o‘tkazish
  const mediaGroup: InputMediaDocument[] = files.map((file) => ({
    type: "document",
    media: { source: file.buffer },
  }));

  const mediaChunks = chunkArray(mediaGroup, 10);

  // Media grouplarni Telegram guruhiga yuborish
  for (const chunk of mediaChunks) {
    await bot.telegram.sendMediaGroup(company.GROUP_ID_NAZORATCHILAR, chunk);
  }

  await bot.telegram.sendMessage(
    company.GROUP_ID_NAZORATCHILAR,
    generateMessageForAbonentList({
      minSaldo,
      maxSaldo,
      identified,
      etkStatus,
      mahalla_name,
    })
  );

  res.status(200).send("Rasmlar muvaffaqiyatli yuborildi!");
};

export const getMfyById = async (req: Request, res: Response): Promise<any> => {
  const mahalla = await Mahalla.findOne({
    id: req.params.mfy_id,
    companyId: req.user.companyId,
  });
  if (!mahalla) return res.json({ ok: false, message: "MFY not found" });

  const company = await Company.findOne({ id: req.user.companyId });

  res.json({ ok: true, data: mahalla, company });
};

export const getAbonentDataByLicshet = async (
  req: Request,
  res: Response
): Promise<any> => {
  const abonentData = await Abonent.findOne({
    licshet: req.params.licshet,
    companyId: req.user.companyId,
  }).select("id");
  if (!abonentData) {
    return res.status(404).json({
      ok: false,
      message: "Abonent mongodbda topilmadi",
    });
  }

  const tozaMakonApi = createTozaMakonApi(req.user.companyId);
  const data = await getAbonentDetails(tozaMakonApi, abonentData.id);

  res.json({
    ok: true,
    abonentData: data,
  });
};

export const getActPacksController = async (req: Request, res: Response) => {
  const tozaMakonApi = createTozaMakonApi(req.user.companyId);
  const data = await getActPacks(tozaMakonApi);
  res.json(data);
};

export const getTariffs = async (req: Request, res: Response) => {
  const tozaMakonApi = createTozaMakonApi(req.user.companyId);
  const company = await Company.findOne({ id: req.user.companyId });
  const { data } = await tozaMakonApi.get(
    "/billing-service/tariffs/population-tariffs",
    {
      params: {
        page: 0,
        size: 100,
        regionId: company?.regionId,
        companyId: company?.id,
      },
    }
  );
  res.json({ tariffs: data.content });
};

export const getAbonentsByMfyIdController = async (
  req: Request,
  res: Response
) => {
  try {
    const data = await getAbonentsByMfyId(req);
    res.json({ ok: true, data });
  } catch (error) {
    res.json({ ok: false, message: "Internal server error 500" });
    console.error(error);
  }
};

export const getAbonentsByMfyIdExcel = async (req: Request, res: Response) => {
  const filteredData = await getAbonentsByMfyId(req);
  const workbook = new Excel.Workbook();
  const worksheet = workbook.addWorksheet("Abonents");
  worksheet.columns = [
    { header: "ID", key: "id", width: 10 },
    { header: "Hisob raqam", key: "accountNumber", width: 20 },
    { header: "FIO", key: "fullName", width: 30 },
    { header: "Ko'cha", key: "streetName", width: 15 },
    { header: "Yashovchilar soni", key: "inhabitantCnt", width: 15 },
    { header: "Saldo", key: "ksaldo", width: 15 },
    { header: "Oxirgi to'lov", key: "lastPaymentAmount", width: 15 },
    { header: "", key: "lastPayDate", width: 15 },
    { header: "Shaxsi tasdiqlangan", key: "isIdentified", width: 15 },
    {
      header: "Elektr Kod tasdiqlangan",
      key: "isElektrKodConfirmForExcel",
      width: 15,
    },
  ];
  worksheet.mergeCells("G1:H1");
  worksheet.getRow(1).eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF0070C0" },
    };
  });
  worksheet.addRows(filteredData);
  const buffer = await workbook.xlsx.writeBuffer();
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader("Content-Disposition", "attachment; filename=abonents.xlsx");
  res.send(buffer);
  res.json({ ok: true, data: filteredData });
};

export const getHouses = async (req: Request, res: Response): Promise<any> => {
  const { cadNum } = req.query;
  if (!cadNum)
    return res.json({ ok: false, message: "cadNum not found on query" });
  const tozaMakonApi = createTozaMakonApi(req.user.companyId);
  const { data } = await tozaMakonApi.get("/billing-service/houses", {
    params: {
      cadNum,
    },
  });
  res.json(data);
};

export const getResidents = async (
  req: Request,
  res: Response
): Promise<any> => {
  const { cadastralNumber, pnfl } = req.query;
  if (!cadastralNumber && !pnfl)
    return res.json({
      ok: false,
      message: "cadastralNumber or pnfl not found on query",
    });

  const tozaMakonApi = createTozaMakonApi(req.user.companyId);
  const result: any = {};
  const resultByCadastralNum = (
    await tozaMakonApi.get("/billing-service/residents", {
      params: {
        cadastralNumber,
        page: 0,
        size: 10,
      },
    })
  ).data.content;

  const resultByPnfl = (
    await tozaMakonApi.get("/billing-service/residents", {
      params: {
        pnfl,
        page: 0,
        size: 10,
      },
    })
  ).data.content;
  result.cadastralNumber = resultByCadastralNum;
  result.pnfl = resultByPnfl;

  res.json(result);
};

export const transferMoneyBetweenResidents = async (
  req: Request,
  res: Response
): Promise<any> => {
  const tozaMakonApi = createTozaMakonApi(req.user.companyId);
  const createdActs = [];

  try {
    // 1. Kiruvchi ma’lumotlarni ajratib olamiz
    let { debitorAct, creditorActs } = req.body;
    debitorAct = JSON.parse(debitorAct);
    creditorActs = JSON.parse(creditorActs);
    if (!debitorAct || !creditorActs)
      return res.json({
        ok: false,
        message: "debitorAct or creditorActs not found on body",
      });
    if (!req.file)
      return res.json({ ok: false, message: "file not found on body" });

    // 2. Faylni yuklab, fileId ni olamiz
    const fileId = await uploadFileToTozaMakon(
      tozaMakonApi,
      req.file.buffer,
      req.file.originalname,
      "SPECIFIC_ACT"
    );

    // 3. Akt pachkasini tayyorlaymiz
    const actPackId = await getOrCreateActPackId(
      "pul_kuchirish",
      tozaMakonApi,
      req.user.companyId
    );

    // 4. Barcha aktlarni yaratamiz
    const acts = await createMoneyTransferActs({
      tozaMakonApi,
      fileId,
      actPackId,
      debitor: debitorAct,
      creditors: creditorActs,
    });
    createdActs.push(...acts);

    res.json({ ok: true, data: acts });
  } catch (error) {
    for (let act of createdActs) {
      await deleteActById(tozaMakonApi, act);
    }
    res.json({ ok: false, message: "Internal server error 500" });
    console.error(error);
  }
};
