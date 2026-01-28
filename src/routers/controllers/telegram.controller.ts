import { bot } from "@bot/core/bot.js";
import { Company } from "@models/Company.js";
import { jobService } from "@services/jobs/job.service.js";
import { JobNames } from "@services/jobs/job.type.js";
import axios from "axios";
import { TEST_BASE_CHANNEL_ID } from "constants.js";
import { Request, Response } from "express";
import fs from "fs";
import path from "path";

export const getFileById = async (req: Request, res: Response) => {
  const fileId = req.params.file_id;

  // Faylning URL manzilini olamiz
  const fileLink = await bot.telegram.getFileLink(fileId);

  // Faylni yuklab olib, bufferga saqlash
  const file = (
    await axios.get(fileLink.href, {
      responseType: "arraybuffer",
    })
  ).data;

  res.send(file);
};

export const uploadDocumentTelegram = async (
  req: Request,
  res: Response
): Promise<any> => {
  if (!req.file) {
    return res.status(400).json({ ok: false, message: "Fayl yuklanmadi!" });
  }

  const document = await bot.telegram.sendDocument(TEST_BASE_CHANNEL_ID, {
    source: req.file.buffer,
    filename: req.file.originalname,
  });

  res.json({ ok: true, document_id: document.document.file_id });
};

export const sendExcelToTelegram = async (
  req: Request,
  res: Response
): Promise<any> => {
  if (
    !req.file ||
    !req.file.mimetype.startsWith(
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ) ||
    !req.file.mimetype.startsWith("application/vnd.ms-excel")
  ) {
    return res.status(400).json({ ok: false, message: "Fayl yuklanmadi!" });
  }

  const fileName = path.join(process.cwd(), "tmp", Date.now() + ".xlsx");
  fs.writeFileSync(fileName, req.file.buffer);
  const company = await Company.findOne({ id: req.user.companyId });

  if (!company) {
    return res.status(404).json({ ok: false, message: "Company not found" });
  }

  await jobService.startJob(JobNames.ExcelToImageAndSendTelegram, {
    companyId: company.id,
    userId: req.user.id,
    excelFilePath: fileName,
    telegramChatId: company.GROUP_ID_NAZORATCHILAR,
  });

  res.json({ ok: true });
};
