import PDFMerger from 'pdf-merger-js';
import { createTozaMakonApi } from '../../api/tozaMakon.js';

import { Abonent } from '@models/Abonent.js';

import { Ariza } from '@models/Ariza.js';

import { bot } from '@bot/core/bot.js';
import { Company } from '@models/Company.js';

import { Mahalla } from '@models/Mahalla.js';

import Excel from 'exceljs';

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
  searchAbonent,
} from '@services/billing/index.js';
import { Request, response, Response } from 'express';
import z from 'zod';
import {
  createDublicateActBodySchema,
  createResidentActBodySchema,
  getAbonentDataRowIdQuerySchema,
  getAbonentsByMfyIdQuerySchema,
  importActsBodySchema,
  sendAbonentsListToTelegramQuerySchema,
} from '@schemas/billing.schema.js';
import { mergePhotosWithPdf } from './utils/mergePhotosWithPdf.js';
import { transferAmountBetweenAccounts } from '@services/billing/transferAmountBetweenAccounts.js';
import { InputMediaDocument, InputMediaPhoto } from 'telegraf/typings/core/types/typegram';
import { chunkArray } from 'helpers/chunkArray.js';
import { generateMessageForAbonentList } from './utils/generateMessageForAbonentList.js';
import { getAbonentsByMfyId } from './utils/getAbonensByMfyId.js';
import { createMoneyTransferActs } from '@services/billing/createMoneyTransferActs.js';
import { jobService, JobService } from '@services/jobs/job.service.js';
import { agenda } from 'config/agenda.js';
import { JobNames } from '@services/jobs/job.type.js';
import { formatDate } from '@services/utils/formatDate.js';
import { createActPack } from '@services/billing/createActPack.js';
import { packTypes } from 'types/billing.js';
import NotFoundError from '@errors/NotFoundError.js';
import { readExcel } from '@helpers/getJsonFromExcel.js';
import { readFileSync } from 'fs';
import path from 'path';
import { Folder } from '@models/Folder.js';
import { confirmActTozamakon } from '@services/billing/confirmActTozamakon.js';
import { getAbonentDetailsHistory } from '@services/billing/getAbonentDetailsHistory.js';

export const downloadPdfFileFromBillingAsBase64 = async (req: Request, res: Response) => {
  const tozaMakonApi = createTozaMakonApi(req.user.companyId);
  // 1. inputlarni olish
  const { file_id } = z.parse(
    z.object({
      file_id: z.string().regex(/.*\*.*/, 'Invalid file_id format'),
    }),
    req.query
  );
  const cleanFileId = file_id.split('*').pop() as string; // "filaname*fileId" => "fileId"

  // 2. faylni yuklab olish
  const buffer = await getFileAsBuffer(tozaMakonApi, cleanFileId);

  // 3. Faylni Base64 ga o'tkazish
  const base64Data = buffer.toString('base64');

  // 4. javob qaytarish
  res.json({
    ok: true,
    file: `data:application/pdf;base64,${base64Data}`,
  });
};

export const getAbonentDHJByAbonentId = async (req: Request, res: Response) => {
  const { page, size } = z
    .object({ page: z.coerce.number().default(1), size: z.coerce.number().default(500) })
    .parse(req.query);
  // 1. inputlarni olish
  const tozaMakonApi = createTozaMakonApi(req.user.companyId);
  const { residentId } = getAbonentDataRowIdQuerySchema.parse(req.query);

  // 2. ma'lumotlarni olish
  const data = await getResidentDHJByAbonentId(tozaMakonApi, residentId, { page, size });

  // 2. javob qaytarish
  res.json({
    ok: true,
    rows: data.content,
    meta: {
      page: data.number,
      size: data.size,
      total: data.totalElements,
    },
  });
};

export const getAbonentDetailsHistoryById = async (req: Request, res: Response) => {
  const tozaMakonApi = createTozaMakonApi(req.user.companyId);
  const { abonentId } = z.object({ abonentId: z.coerce.number() }).parse(req.params);
  const data = await getAbonentDetailsHistory(tozaMakonApi, abonentId);
  res.json(data);
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

export const createResidentAct = async (req: Request, res: Response): Promise<any> => {
  let { next_inhabitant_count, akt_sum, amountWithoutQQS, document_type, description, ariza_id, photos, residentId } =
    createResidentActBodySchema.parse(req.body);

  const companyId = req.user.companyId;
  const date = new Date();
  const tozaMakonApi = createTozaMakonApi(companyId);

  if (!req.file?.buffer) throw new NotFoundError('Faylni yuklang');
  // 🖼️ 1. Agar rasm bo‘lsa — PDFga qo‘shamiz
  if (photos?.length) {
    req.file.buffer = await mergePhotosWithPdf(photos, req.file.buffer);
  }

  // 📎 2. Faylni Telegramga yuklaymiz bu qism ishlatilmayotganligi sababli olib tashlandi
  // 👥 3. Agar pasport viza yoki sifatsiz xizmat (muzlatishdan tashqari) akti bo'lsa yashovchi sonini joriyni qo'yish
  if (document_type === 'viza' || (document_type === 'gps' && next_inhabitant_count)) {
    const abonent = await getAbonentDetails(tozaMakonApi, residentId);
    next_inhabitant_count = abonent.house.inhabitantCnt;
  }

  // 📤 4. Faylni TozaMakon APIga yuklash
  const fileId = await uploadFileToTozaMakon(tozaMakonApi, req.file.buffer, req.file.originalname, 'SPECIFIC_ACT');

  // 📦 5. Akt Pachkasini olish
  const actPackId = await getOrCreateActPackId(document_type, tozaMakonApi, companyId);

  // 📊 6. kSaldo hisoblash
  const kSaldo = await calculateKSaldo(tozaMakonApi, {
    amount: Math.abs(akt_sum),
    residentId: residentId,
    actPackId,
    actType: akt_sum < 0 ? 'DEBIT' : 'CREDIT',
  });

  // 📌 7. Aktni yaratish
  const aktPayload: ICreateActPayload = {
    actPackId,
    actType: akt_sum < 0 ? 'DEBIT' : 'CREDIT',
    amount: Number(akt_sum),
    amountWithQQS: Number(akt_sum) - (Number(amountWithoutQQS) || 0),
    amountWithoutQQS: Number(amountWithoutQQS) || 0,
    description,
    endPeriod: `${date.getMonth() + 1}.${date.getFullYear()}`,
    startPeriod: `${date.getMonth() + 1}.${date.getFullYear()}`,
    fileId,
    kSaldo,
    residentId: residentId,
    inhabitantCount: next_inhabitant_count,
  };
  const actInfo = await createAct(tozaMakonApi, aktPayload);

  // 📄 8. Agar ariza bo'lsa akt ma'lumotlari yozib qolinadi
  let folderId = null;
  if (ariza_id) {
    const ariza = await Ariza.findByIdAndUpdate(ariza_id, {
      $set: {
        status: 'akt_kiritilgan',
        akt_pachka_id: actPackId,
        akt_id: actInfo.id,
        aktInfo: actInfo,
        akt_date: actInfo.createdAt,
      },
    });
    if (ariza) {
      const folder = await Folder.addArizaToFolder(companyId, {
        accountNumber: ariza.licshet,
        ariza_id: ariza_id,
        arizaNumber: ariza.document_number,
        arizaType: ariza.document_type,
      });
      folderId = folder.id;
    }
  }

  // ✅ 9. Akt tasdiqlash
  await confirmActTozamakon(tozaMakonApi, [actInfo.id]);

  // 🥇 10. Natija
  return res.json({
    ok: true,
    folderId,
    message: 'Akt muvaffaqqiyatli qo‘shildi',
  });
};

export const duplicateActFromRequest = async (req: Request, res: Response): Promise<any> => {
  const { ariza_id, akt_sum } = req.body;

  const ariza = await Ariza.findById(ariza_id);

  if (!ariza) {
    return res.status(404).json({ ok: false, message: 'Ariza topilmadi' });
  }

  if (!req.file?.buffer) {
    return res.status(400).json({
      ok: false,
      message: 'Faylni yuklang',
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
      message: 'Abonentlar topilmadi',
    });
  }

  const tozaMakonApi = createTozaMakonApi(companyId);

  // 1. Faylni TozaMakon APIga yuklash
  const fileId = await uploadFileToTozaMakon(tozaMakonApi, req.file.buffer, req.file.originalname, 'SPECIFIC_ACT');

  // 2. Akt pachkalarini olish
  const pulKuchirishPackId = await getOrCreateActPackId('pul_kuchirish', tozaMakonApi, companyId);
  const dvaynikPackId = await getOrCreateActPackId('dvaynik', tozaMakonApi, companyId);
  const odamSoniPackId = await getOrCreateActPackId('odam_soni', tozaMakonApi, companyId);

  // 3. Odam soni aktlarini yaratish
  const abonentData = await getAbonentDetails(tozaMakonApi, abonentReal.id);
  if (abonentData.house.inhabitantCnt !== ariza.next_prescribed_cnt) {
    const odamSoniAct = await createAct(tozaMakonApi, {
      actPackId: odamSoniPackId,
      actType: 'DEBIT',
      amount: 0,
      amountWithoutQQS: 0,
      amountWithQQS: 0,
      description: 'Ikkilamchi dalolatnomasi',
      endPeriod: `${new Date().getMonth() + 1}.${new Date().getFullYear()}`,
      startPeriod: `${new Date().getMonth() + 1}.${new Date().getFullYear()}`,
      fileId,
      inhabitantCount: ariza.next_prescribed_cnt,
      kSaldo: await calculateKSaldo(tozaMakonApi, {
        actPackId: odamSoniPackId,
        amount: 0,
        actType: 'DEBIT',
        residentId: abonentReal.id,
      }),
      residentId: abonentReal.id,
    });
    confirmActTozamakon(tozaMakonApi, [odamSoniAct.id]);
  }

  // 4. Pul ko‘chirish aktlarini yaratish
  if (Number(akt_sum))
    await transferAmountBetweenAccounts(tozaMakonApi, {
      amount: Number(akt_sum),
      residentFrom: abonentFake.id,
      residentTo: abonentReal.id,
      actPackId: pulKuchirishPackId,
      fileId,
      descriptionPrefix: `${abonentFake.licshet} → ${abonentReal.licshet}`,
    });

  // 5. Dvaynikni yopish
  const amountObj = await calculateAmount(tozaMakonApi, {
    residentId: abonentFake.id,
    inhabitantCount: 0,
    kSaldo: 0,
    actPackId: dvaynikPackId,
  });

  const dvaynikAct = await createAct(tozaMakonApi, {
    actPackId: dvaynikPackId,
    actType: 'CREDIT',
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

  // 6. Arizani yangilash
  await ariza.updateOne({
    $set: {
      status: 'akt_kiritilgan',
      akt_pachka_id: dvaynikPackId,
      akt_id: dvaynikAct.id,
      aktInfo: dvaynikAct,
      akt_date: new Date(),
    },
  });

  // 7. Papkaga qo'shish
  const folderId = await Folder.addArizaToFolder(companyId, {
    accountNumber: ariza.ikkilamchi_licshet,
    ariza_id: ariza_id,
    arizaNumber: ariza.document_number,
    arizaType: ariza.document_type,
  });

  res.json({ ok: true, message: 'Aktlar muvaffaqiyatli yaratildi', folderId });
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

export const createDublicateAct = async (req: Request, res: Response): Promise<any> => {
  // inputlarni olish
  const { realAccountNumber, fakeAccountNumber, fakeAccountIncomeAmount } = createDublicateActBodySchema.parse(
    req.body
  );

  const tozaMakonApi = createTozaMakonApi(req.user.companyId);
  const date = new Date();
  const abonentReal = await Abonent.findOne({ licshet: realAccountNumber });
  const abonentFake = await Abonent.findOne({ licshet: fakeAccountNumber });

  if (!abonentReal || !abonentFake) {
    return res.status(404).json({
      ok: false,
      message: 'Abonentlar topilmadi',
    });
  }
  if (!req.file) {
    return res.status(404).json({
      ok: false,
      message: 'Fayl kiriting',
    });
  }

  // 1. 📎 Faylni TozaMakonga yuklash
  const fileId = await uploadFileToTozaMakon(tozaMakonApi, req.file.buffer, req.file.originalname, 'SPECIFIC_ACT');

  // 2. 📁 Akt pachkalarini olish
  const pulKochirishPackId = await getOrCreateActPackId('pul_kuchirish', tozaMakonApi, req.user.companyId);
  const dvaynikPackId = await getOrCreateActPackId('dvaynik', tozaMakonApi, req.user.companyId);

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
    actPackId: dvaynikPackId,
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
    message: 'muvaffaqqiyatli akt qilindi',
  });
};

export const sendAbonentsListToTelegram = async (req: Request, res: Response): Promise<any> => {
  let { minSaldo, maxSaldo, identified, elektrAccountNumberConfirmed, mahalla_name } =
    sendAbonentsListToTelegramQuerySchema.parse(req.query);
  const files = req.files;

  const company = await Company.findOne({ id: req.user.companyId });
  if (!company) {
    return res.status(404).send('Company topilmadi!');
  }

  if (!files || files.length === 0 || !Array.isArray(files)) {
    return res.status(400).send('Hech qanday fayl yuklanmadi!');
  }

  // Yuklangan fayllarni Telegram media group formatiga o‘tkazish
  const mediaGroup: InputMediaPhoto[] = files.map((file) => ({
    type: 'photo',
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
      etkStatus: elektrAccountNumberConfirmed,
      mahalla_name,
    })
  );

  res.status(200).send('Rasmlar muvaffaqiyatli yuborildi!');
};

export const getMfyById = async (req: Request, res: Response): Promise<any> => {
  const mahalla = await Mahalla.findOne({
    id: req.params.mfy_id,
    companyId: req.user.companyId,
  });
  if (!mahalla) return res.json({ ok: false, message: 'MFY not found' });

  const company = await Company.findOne({ id: req.user.companyId }).lean();
  if (!company) return res.json({ ok: false, message: 'Company not found' });

  const companyForReturn = {
    id: company.id,
    name: company.name,
    phone: company.phone,
    manager: company.manager,
    billingAdmin: company.billingAdmin,
    gpsOperator: company.gpsOperator,
    locationName: company.locationName,
    regionId: company.regionId,
    abonentsPrefix: company.abonentsPrefix,
    districtId: company.districtId,
  };

  res.json({ ok: true, data: mahalla, company: companyForReturn });
};

export const getAbonentDataByLicshet = async (req: Request, res: Response): Promise<any> => {
  const abonentData = await Abonent.findOne({
    licshet: req.params.licshet,
    companyId: req.user.companyId,
  }).select('id');
  if (!abonentData) {
    return res.status(404).json({
      ok: false,
      message: 'Abonent mongodbda topilmadi',
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
  let companyId = req.user.companyId;
  if (companyId == 1824) companyId = 1144;
  const tozaMakonApi = createTozaMakonApi(companyId);
  const company = await Company.findOne({ id: companyId });
  const { data } = await tozaMakonApi.get('/billing-service/tariffs/population-tariffs', {
    params: {
      page: 0,
      size: 100,
      regionId: company?.regionId,
      companyId: company?.id,
    },
  });
  res.json({ tariffs: data.content });
};

export const getAbonentsByMfyIdController = async (req: Request, res: Response) => {
  try {
    const data = await getAbonentsByMfyId(req as any);
    res.json({ ok: true, data });
  } catch (error) {
    res.json({ ok: false, message: 'Internal server error 500' });
    console.error(error);
  }
};

export const getAbonentsByMfyIdExcel = async (req: Request, res: Response) => {
  const filteredData = await getAbonentsByMfyId(req as any);
  const workbook = new Excel.Workbook();
  const worksheet = workbook.addWorksheet('Abonents');
  worksheet.columns = [
    { header: 'ID', key: 'id', width: 10 },
    { header: 'Hisob raqam', key: 'accountNumber', width: 20 },
    { header: 'FIO', key: 'fullName', width: 30 },
    { header: "Ko'cha", key: 'streetName', width: 15 },
    { header: 'Yashovchilar soni', key: 'inhabitantCnt', width: 15 },
    { header: 'Saldo', key: 'ksaldo', width: 15 },
    { header: "Oxirgi to'lov", key: 'lastPaymentAmount', width: 15 },
    { header: '', key: 'lastPayDate', width: 15 },
    { header: 'Shaxsi tasdiqlangan', key: 'isIdentified', width: 15 },
    {
      header: 'Elektr Kod tasdiqlangan',
      key: 'isElektrKodConfirmForExcel',
      width: 15,
    },
  ];
  worksheet.mergeCells('G1:H1');
  worksheet.getRow(1).eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0070C0' },
    };
  });
  worksheet.addRows(filteredData);
  const buffer = await workbook.xlsx.writeBuffer();
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=abonents.xlsx');
  res.send(buffer);
  res.json({ ok: true, data: filteredData });
};

export const getHouses = async (req: Request, res: Response): Promise<any> => {
  const { cadNum } = req.query;
  if (!cadNum) return res.json({ ok: false, message: 'cadNum not found on query' });
  const tozaMakonApi = createTozaMakonApi(req.user.companyId);
  const { data } = await tozaMakonApi.get('/billing-service/houses', {
    params: {
      cadNum,
    },
  });
  res.json(data);
};

export const getResidents = async (req: Request, res: Response): Promise<any> => {
  const { cadastralNumber, pnfl } = req.query;
  if (!cadastralNumber && !pnfl)
    return res.json({
      ok: false,
      message: 'cadastralNumber or pnfl not found on query',
    });

  const tozaMakonApi = createTozaMakonApi(req.user.companyId);
  const result: any = {};
  // const resultByCadastralNum = (
  //   await tozaMakonApi.get("/billing-service/residents", {
  //     params: {
  //       cadastralNumber,
  //       page: 0,
  //       size: 10,
  //     },
  //   })
  // ).data.content;

  const resultByPnfl = (
    await searchAbonent(tozaMakonApi, {
      pnfl: pnfl?.toString(),
      size: 10,
      page: 0,
      companyId: req.user.companyId,
    })
  ).content;

  // result.cadastralNumber = resultByCadastralNum;
  result.pnfl = resultByPnfl;

  res.json(result);
};

export const transferMoneyBetweenResidents = async (req: Request, res: Response): Promise<any> => {
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
        message: 'debitorAct or creditorActs not found on body',
      });
    if (!req.file) return res.json({ ok: false, message: 'file not found on body' });

    // 2. Faylni yuklab, fileId ni olamiz
    const fileId = await uploadFileToTozaMakon(tozaMakonApi, req.file.buffer, req.file.originalname, 'SPECIFIC_ACT');

    // 3. Akt pachkasini tayyorlaymiz
    const actPackId = await getOrCreateActPackId('pul_kuchirish', tozaMakonApi, req.user.companyId);

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
      await deleteActById(tozaMakonApi, act.id);
    }
    res.json({ ok: false, message: 'Internal server error 500' });
    console.error(error);
  }
};

export const importActs = async (req: Request, res: Response): Promise<any> => {
  // 1. Kiruvchi ma’lumotlarni ajratib olamiz
  // avvalo excel fayldan ma'lumotlarni olib acts arrayiga yuklaymiz
  if (!req.file) return res.json({ ok: false, message: 'file not found on body' });
  const data = readExcel(req.file?.buffer);

  req.body.acts = data.map((a) => ({
    ...a,
    next_inhabitant_count: a.inhabitantCount,
    akt_sum: a.Summa,
    licshet: a.accountNumber,
    // document_type: "odam_soni", //VAQTINGCHA
    description: a.comment,
  }));

  let { acts, actPackId, fileId, packType } = importActsBodySchema.parse(req.body);
  console.log(actPackId);
  if (!actPackId || isNaN(actPackId)) {
    const tozaMakonApi = createTozaMakonApi(req.user.companyId);
    actPackId = await createActPack(tozaMakonApi, {
      companyId: req.user.companyId,
      name: 'Imported acts',
      createdDate: formatDate(new Date()),
      description: 'Imported acts',
      isActive: true,
      isSpecialPack: false,
      packType: packType as packTypes,
    });
  }

  await jobService.startJob(JobNames.ImportActs, {
    acts: acts.map((a) => ({
      actPackId: actPackId,
      actType: a.akt_sum > 0 ? 'CREDIT' : ('DEBIT' as 'DEBIT' | 'CREDIT'),
      amount: a.akt_sum,
      amountWithQQS: a.akt_sum,
      amountWithoutQQS: 0,
      description: a.description,
      endPeriod: formatDate(new Date(), 'M.YYYY'),
      startPeriod: formatDate(new Date(), 'M.YYYY'),
      fileId,
      kSaldo: 0,
      residentId: a.residentId,
      inhabitantCount: a.next_inhabitant_count,
    })),
    companyId: req.user.companyId,
    userId: req.user.id,
  });

  res.json({ ok: true, message: 'Import job started' });
};

export const uploadFileTozamakon = async (req: Request, res: Response): Promise<any> => {
  if (!req.file) return res.json({ ok: false, message: 'file not found on body' });

  const fileId = await uploadFileToTozaMakon(
    createTozaMakonApi(req.user.companyId),
    req.file?.buffer,
    req.file?.originalname,
    'SPECIFIC_ACT'
  );

  return res.json({ ok: true, fileId });
};

export const getAbonentDetailsById = async (req: Request, res: Response): Promise<any> => {
  const tozaMakonApi = createTozaMakonApi(req.user.companyId);
  const { abonentId } = z.object({ abonentId: z.coerce.number() }).parse(req.params);
  const data = await getAbonentDetails(tozaMakonApi, abonentId);
  res.json(data);
};
