import { SudAkt } from "@models/SudAkt.js";
import { Abonent } from "@models/Abonent.js";
import { Counter } from "@models/Counter.js";
import Excel from "exceljs";
import {
  createManySudArizaBodySchema,
  getHybridMailsQuerySchema,
  getSudAktsQuerySchema,
} from "@schemas/court.schema.js";
import { Handler, Request, Response } from "express";
import { bot } from "@bot/core/bot.js";
import z from "zod";
import { HybridMail } from "@models/HybridMail.js";
import { chunkArray } from "@helpers/chunkArray.js";
import { createHybridPochtaApi } from "@api/hybridPochta.js";
import { getOneHybridMail } from "@services/hybrydPost/getOneHybridMail.js";
import { createTozaMakonApi } from "@api/tozaMakon.js";
import { renderHtmlByEjs } from "@helpers/renderHtmlByEjs.js";
import { createPdfFromHtml } from "@helpers/createPdfFromHtml.js";
import PDFMerger from "pdf-merger-js";
import { getHybridMailChek } from "@services/hybrydPost/getHybridMailChek.js";

export const getSudAkts: Handler = async (req, res) => {
  const {
    page = 1,
    limit = 10,
    sortField = "sana",
    sortDirection = "asc",
    status,
    account_number,
    warning_date_from,
    warning_date_to,
    claim_amount_from,
    claim_amount_to,
    case_number,
    pinfl,
  } = getSudAktsQuerySchema.parse(req.query);
  const skip = (page - 1) * limit;
  const sortOptions: any = {};
  sortOptions[sortField] = sortDirection === "asc" ? 1 : -1;
  const filters: any = {};

  if (status) filters.status = status;
  if (account_number) filters.licshet = account_number;
  if (warning_date_from)
    filters.warningDate = { $gte: new Date(warning_date_from) };
  if (warning_date_to)
    filters.warningDate = {
      ...filters.warningDate,
      $lte: new Date(warning_date_to),
    };
  if (claim_amount_from) filters.claimAmount = { $gte: claim_amount_from };
  if (claim_amount_to)
    filters.claimAmount = {
      ...filters.claimAmount,
      $lte: claim_amount_to,
    };
  if (case_number) filters.sud_case_number = case_number;
  if (pinfl) filters.pinfl = pinfl;

  const data = await SudAkt.find(filters)
    .sort(sortOptions)
    .skip(skip)
    .limit(limit)
    .lean();
  const totalCount = await SudAkt.countDocuments(filters);
  res.status(200).json({
    ok: true,
    data: data,
    meta: {
      total: totalCount,
      page: page,
      limit: limit,
      totalPages: Math.ceil(totalCount / limit),
    },
  });
};

export const getCourtCaseBySudAktId = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const sudAkt = await SudAkt.findById(req.params._id);
    if (!sudAkt)
      return res.status(404).json({
        ok: false,
        message: "Data not found",
      });
    let data: any = await fetch(
      "https://cabinetapi.sud.uz/api/cabinet/case/civil/all-cases?size=30&page=0&withCreated=true&case_number=" +
        sudAkt.sud_case_number,
      {
        headers: {
          accept: "application/json, text/plain, */*",
          "accept-language": "en-GB,en-US;q=0.9,en;q=0.8,uz;q=0.7,ru;q=0.6",
          "content-type": "application/json",
          responsetype: "arraybuffer",
          "sec-ch-ua":
            '"Chromium";v="134", "Not:A-Brand";v="24", "Google Chrome";v="134"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"Windows"',
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-site",
          "x-auth-token": "1435fdf8-eafa-4edd-b746-aa9a3495bfd7",
        },
        referrer: "https://cabinet.sud.uz/",
        referrerPolicy: "strict-origin-when-cross-origin",
        body: null,
        method: "GET",
        mode: "cors",
        credentials: "omit",
      }
    );
    data = (await data.json()).content;
    const courtCase = data.find(
      (a: any) => a.case_number === sudAkt.sud_case_number
    );
    if (!courtCase) {
      return res.status(404).json({
        ok: false,
        message: "Data not found",
      });
    }
    res.json({
      ok: true,
      data: courtCase,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, message: "Interval Server Error" });
  }
};

export const getOneSudAkt = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const filters = req.body;
    const data = await SudAkt.findOne(filters);
    if (!data) {
      return res.status(404).json({
        ok: false,
        message: "not found",
      });
    }
    res.json({
      ok: true,
      data,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      ok: false,
      message: "Internal server error",
    });
  }
};

export const searchByLicshetSudakt = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { licshet } = req.query;
    if (!licshet) {
      return res.json({ ok: false, message: "Licshet kiritilmadi" });
    }
    const results = await SudAkt.countDocuments({
      licshet: new RegExp(licshet as string),
      $or: [{ status: "yangi" }, { status: "ariza_yaratildi" }],
    });
    if (results > 30) {
      return res.json({ ok: false, message: "Juda ko'p natijalar aniqlandi" });
    }
    const sudAkts = await SudAkt.find({
      licshet: new RegExp(licshet as string),
      $or: [{ status: "yangi" }, { status: "ariza_yaratildi" }],
    });
    res.json({ ok: true, rows: sudAkts });
  } catch (error) {
    res.json({ ok: false, message: "Internal server error 500" });
    console.error(error);
  }
};

export const createSudAriza = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const sudAkt = await SudAkt.findById(req.params._id);
    if (!sudAkt) {
      return res.json({ ok: false, message: "SudAkt topilmadi" });
    }

    const { ariza_date, ariza_type } = req.body;
    if (!ariza_date || !ariza_type) {
      return res.json({
        ok: false,
        message: "Ariza tartib raqami yoki turi kiritilmadi",
      });
    }
    const counter = await Counter.findOne({
      name: "sudga_ariza_tartib_raqami",
    });
    if (!counter) throw new Error("Counter topilmadi");
    await sudAkt.updateOne({
      $set: {
        ariza_order_num: counter.value + 1,
        ariza_date,
        ariza_type,
        status: "ariza_yaratildi",
      },
    });
    await counter.updateOne({ $set: { value: counter.value + 1 } });
    res.json({
      ok: true,
      sudAkt,
      ariza_order_num: counter.value,
      message: "Ariza tartib raqami qo'shildi",
    });
  } catch (error) {
    res.json({ ok: false, message: "Internal server error 500" });
    console.error(error);
  }
};

export const createManySudAriza = async (
  req: Request,
  res: Response
): Promise<any> => {
  const { sudAktIds, ariza_date, ariza_type } =
    createManySudArizaBodySchema.parse(req.body);
  if (!sudAktIds || sudAktIds.length === 0) {
    return res.json({ ok: false, message: "SudAkt idlari kiritilmadi" });
  }

  if (!ariza_date || !ariza_type) {
    return res.json({
      ok: false,
      message: "Ariza sanasi yoki turi kiritilmadi",
    });
  }
  if (!SudAkt.schema.paths.ariza_type.options.enum.includes(ariza_type)) {
    return res.json({
      ok: false,
      message: "Ariza turi mavjud emas",
    });
  }
  const sudAkts = await SudAkt.find({ _id: { $in: sudAktIds } });
  if (sudAkts.length !== sudAktIds.length) {
    return res.json({ ok: false, message: "SudAkt topilmadi" });
  }
  const updatedSudAkts = [];
  for (const sudAkt of sudAkts) {
    if (sudAkt.status === "yangi") {
      const counter = await Counter.findOne({
        name: "sudga_ariza_tartib_raqami",
      });
      if (!counter) throw new Error("Counter topilmadi");
      const newOrderNum = counter.value + 1;
      sudAkt.ariza_order_num = newOrderNum;
      sudAkt.ariza_date = ariza_date;
      sudAkt.ariza_type = ariza_type as "prokuratura" | "savdo-sanoat";
      sudAkt.status = "ariza_yaratildi";
      await sudAkt.save();
      updatedSudAkts.push(sudAkt.toObject());
      await counter.updateOne({ $set: { value: newOrderNum } });
    } else {
      !sudAkt.ariza_date ? (sudAkt.ariza_date = ariza_date) : null;
      updatedSudAkts.push(sudAkt.toObject());
    }
  }
  return res.json({ ok: true, rows: updatedSudAkts });
};

export const uploadSudArizaFile = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { file } = req;
    const { sud_akt_id } = req.body;
    if (!file) {
      return res.json({ ok: false, message: "File not found" });
    }
    if (!file.mimetype.startsWith("application/pdf")) {
      return res.json({
        ok: false,
        message: "Invalid file format. Please upload a PDF file",
      });
    }
    if (!sud_akt_id) {
      return res.json({ ok: false, message: "SudAkt id not found" });
    }
    const sud_akt = await SudAkt.findById(sud_akt_id);
    if (!sud_akt) {
      return res.status(404).json({ ok: false, message: "SudAkt not found" });
    }
    const blobName = `ariza-file-${Date.now()}-${file.originalname}`;
    const telegram_res = await bot.telegram.sendDocument(
      process.env.TEST_BASE_CHANNEL_ID as string,
      {
        source: file.buffer,
        filename: blobName,
      }
    );
    await sud_akt.updateOne({
      $set: {
        ariza_file_id: telegram_res.document.file_id,
        ariza_file_name: blobName,
        status: "ariza_imzolandi",
      },
    });

    res.json({ ok: true, message: "Muvaffaqqiyatli yuklandi" });
  } catch (err) {
    res.json({ ok: false, message: "Internal server error 500" });
    console.error(err);
  }
};

export const getDebitorAbonents = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { companyId } = req.user;
    const { balanceFrom, balanceTo, mahallaId, sudAkt, warning, page, size } =
      req.query;

    const filters: any = { companyId };
    if (balanceFrom) filters.ksaldo = { $gte: balanceFrom };
    if (balanceTo) filters.ksaldo = { ...filters.ksaldo, $lte: balanceTo };
    if (mahallaId) filters.mahallas_id = mahallaId;
    if (sudAkt) {
      if (sudAkt === "true") filters["sudAkt.id"] = { $exists: 1 };
      else if (sudAkt === "false") filters["sudAkt.id"] = { $exists: 0 };
      else
        return res.status(400).json({
          ok: false,
          message: "sudAkt's value wrong",
        });
    }
    if (warning) {
      if (warning === "true") filters["warningLetter.id"] = { $exists: 1 };
      else if (warning === "false")
        filters["warningLetter.id"] = { $exists: 0 };
      else
        return res.status(400).json({
          ok: false,
          message: "warning's value wrong",
        });
    }
    const abonents = await Abonent.find(filters);
    // .skip(size * page)
    // .limit(size); // typescript xato bergani uchun vaqtincha o'chirib qo'ydim ochish kerak buni
    const countAbonents = await Abonent.countDocuments(filters);

    res.json({
      ok: true,
      rows: abonents,
      total: countAbonents,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, message: "Internal server error 500" });
  }
};

export const getDebitorAbonentsExcel = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { companyId } = req.user;
    const { balanceFrom, balanceTo, mahallaId, sudAkt, warning } = req.query;

    const filters: any = { companyId };
    if (balanceFrom)
      filters.ksaldo = { $gte: parseFloat(balanceFrom as string) };
    if (balanceTo)
      filters.ksaldo = {
        ...filters.ksaldo,
        $lte: parseFloat(balanceTo as string),
      };
    if (mahallaId) filters.mahallas_id = mahallaId;
    if (sudAkt) {
      if (sudAkt === "true") filters["sudAkt.id"] = { $exists: 1 };
      else if (sudAkt === "false") filters["sudAkt.id"] = { $exists: 0 };
      else
        return res.status(400).json({
          ok: false,
          message: "sudAkt's value wrong",
        });
    }
    if (warning) {
      if (warning === "true") filters["warningLetter.id"] = { $exists: 1 };
      else if (warning === "false")
        filters["warningLetter.id"] = { $exists: 0 };
      else
        return res.status(400).json({
          ok: false,
          message: "warning's value wrong",
        });
    }

    const abonents = await Abonent.find(filters);
    const workbook = new Excel.Workbook();
    const worksheet = workbook.addWorksheet("Abonents");
    worksheet.columns = [
      { header: "ID", key: "id", width: 15 },
      { header: "Hisob raqami", key: "licshet", width: 15 },
      { header: "F.I.O.", key: "fullName", width: 30 },
      { header: "Mahalla", key: "mahalla", width: 15 },
      { header: "Qarzdorlik", key: "ksaldo", width: 15 },
      { header: "Sud Akt id", key: "sudAktId", width: 15 },
      { header: "Sud Akt sana", key: "sudAktDate", width: 15 },
      { header: "Ogohlantirish id", key: "warningLetterId", width: 15 },
      { header: "Ogohlantirish sana", key: "warningLetterDate", width: 15 },
      { header: "Shaxsi tasdiqlangan", key: "shaxsi_tasdiqlandi", width: 15 },
    ];
    abonents.forEach((abonent) => {
      worksheet.addRow({
        id: abonent.id,
        licshet: abonent.licshet,
        fullName: abonent.fio,
        mahalla: abonent.mahalla_name,
        ksaldo: abonent.ksaldo,
        sudAktId: abonent.sudAkt?.id,
        sudAktDate: abonent.sudAkt?.createdDate,
        warningLetterId: abonent.warningLetter?.id,
        warningLetterDate: abonent.warningLetter?.createdDate,
        shaxsi_tasdiqlandi: abonent.shaxsi_tasdiqlandi?.confirm ? "✅" : "❌",
      });
    });
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF0070C0" },
      };
    });
    // Export qilish
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", "attachment; filename=abonents.xlsx");
    await workbook.xlsx.write(res);
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, message: "Internal server error 500" });
  }
};

export const updateHybridMailsStatus = async (
  req: Request,
  res: Response
): Promise<any> => {
  const mailIds = z.array(z.string()).parse(req.body.mailIds);
  const hybridMails = await HybridMail.find({ _id: { $in: mailIds } });
  const chunkedHybridMails = chunkArray(hybridMails, 10);
  const hybridPochtaApi = createHybridPochtaApi(req.user.companyId);
  const result: any[] = [];
  for (const chunk of chunkedHybridMails) {
    await Promise.all(
      chunk.map(async (mail) => {
        const hybridMail = await getOneHybridMail(
          hybridPochtaApi,
          mail.hybridMailId
        );
        const updated = await HybridMail.findByIdAndUpdate(
          mail._id,
          {
            $set: {
              isSent: hybridMail.IsSent,
              sentOn: hybridMail.SentOn,
            },
          },
          {
            new: true,
          }
        );
        result.push(updated);
      })
    );
  }
  return res.json({ ok: true, content: result });
};

export const updateMailStatus = async (
  req: Request,
  res: Response
): Promise<any> => {
  const mail = await HybridMail.findById(req.params.mail_id);
  if (!mail) {
    return res.status(400).json({ ok: false, message: "Mail not found" });
  }
  const hybridPochtaApi = createHybridPochtaApi(req.user.companyId);
  const hybridMail = await getOneHybridMail(hybridPochtaApi, mail.hybridMailId);
  const content = await HybridMail.findByIdAndUpdate(mail._id, {
    $set: {
      isSent: hybridMail.IsSent,
      sentOn: hybridMail.SentOn,
    },
  });
  res.status(200).json({ ok: true, content });
};

export const getHybridMails = async (
  req: Request,
  res: Response
): Promise<any> => {
  let {
    page = 1,
    limit = 10,
    sortField = "createdOn",
    sortDirection = "asc",
    fromDate,
    toDate,
    ...filters
  } = getHybridMailsQuerySchema.parse(req.query);

  const sortOptions: any = {};
  sortOptions[sortField] = sortDirection === "asc" ? 1 : -1;
  const skip = (page - 1) * limit;

  const startDate = new Date(fromDate.getFullYear(), fromDate.getMonth(), 1); // JavaScript oylari 0-indeksli
  const endDate = new Date(
    toDate.getFullYear(),
    toDate.getMonth() + 1,
    0,
    23,
    59,
    59,
    999
  ); // Oy oxiri

  // ma'lumotlarni olish
  const mails = await HybridMail.find({
    createdOn: {
      $gt: startDate,
      $lt: endDate,
    },
    ...filters,
  })
    .limit(limit)
    .skip(skip)
    .sort(sortOptions);
  console.log(filters);
  const total = await HybridMail.countDocuments({
    createdOn: {
      $gte: startDate,
      $lte: endDate,
    },
    ...filters,
  });
  res.json({
    ok: true,
    rows: mails,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
};

export const getOneHybridMailFromDb = async (
  req: Request,
  res: Response
): Promise<any> => {
  const mail = await HybridMail.findById(req.params.mail_id);
  if (!mail)
    return res.status(400).json({ ok: false, message: "Mail not found" });
  res.json({ ok: true, row: mail });
};

export const updateMailWarningAmount = async (
  req: Request,
  res: Response
): Promise<any> => {
  const mail = await HybridMail.findByIdAndUpdate(req.params.mail_id, {
    $set: { warning_amount: req.body.warning_amount },
  });
  if (!mail) return res.json({ ok: false, message: "Mail not found" });
  res.json({ ok: true, message: "Yangilandi" });
};

export const uploadCashToBilling = async (
  req: Request,
  res: Response
): Promise<any> => {
  const row = await HybridMail.findById(req.params.mail_id);
  if (!row) {
    return res.status(400).json({ ok: false, message: "Mail not found" });
  }
  const hybridPochtaApi = createHybridPochtaApi(req.user.companyId);

  const pdf = await hybridPochtaApi.get(`/PdfMail/` + row.hybridMailId, {
    responseType: "arraybuffer",
  });
  const warningLetterPDF = Buffer.from(pdf.data);
  const cashPDF = await getHybridMailChek(req.user.companyId, row.hybridMailId);
  let merger = new PDFMerger();
  await merger.add(warningLetterPDF);
  await merger.add(cashPDF);
  await merger.setMetadata({
    producer: "oliy ong",
    author: "Shamshod Nematullayev",
    creator: "Toza Hudud bot",
    title: "Ogohlantirish xati",
  });
  const bufferWarningWithCash = await merger.saveAsBuffer();
  const uint = new Uint8Array(bufferWarningWithCash);
  const blob = new Blob([uint], { type: "application/pdf" });
  const formData = new FormData();
  formData.append("file", blob, row.hybridMailId + `.pdf`);
  // billingdan sudAktini topish
  const tozaMakonApi = createTozaMakonApi(req.user.companyId);
  const courtWarnings = (
    await tozaMakonApi.get(`/user-service/court-warnings`, {
      params: {
        accountNumber: row.licshet,
      },
    })
  ).data.content;
  const courtWarning = courtWarnings.find(
    (item: any) =>
      item.litigationStatus === "DEBT_PAID" || item.litigationStatus === "NEW"
  );
  if (!courtWarning) {
    return res
      .status(400)
      .json({ ok: false, message: "Sud akti billingda topilmadi" });
  }

  const fileUploadBilling = (
    await tozaMakonApi.post("/file-service/buckets/upload", formData, {
      params: {
        folderType: "SUD_PROCESS",
      },
      headers: { "Content-Type": "multipart/form-data" },
    })
  ).data;
  await tozaMakonApi.post(
    "/user-service/court-processes/" + courtWarning.id + "/add-file",
    {
      description: `warning letter by hybrid`,
      fileName: `${fileUploadBilling.fileName}*${fileUploadBilling.fileId}`,
      fileType: "WARNING_FILE",
    }
  );

  const content = await HybridMail.findByIdAndUpdate(
    row._id,
    {
      $set: {
        isSavedBilling: true,
        sud_process_id_billing: courtWarning.id,
      },
    },
    { new: true }
  );
  res.status(200).json({ ok: true, content });
};

export const getHybridMailChekAndSend = async (
  req: Request,
  res: Response
): Promise<any> => {
  const cashPDF = await getHybridMailChek(
    req.user.companyId,
    req.params.mail_id
  );

  const base64 = cashPDF.toString("base64");

  res.status(200).send({
    ok: true,
    file: `data:application/pdf;base64,${base64}`,
  });
};
