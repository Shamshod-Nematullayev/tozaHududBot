import { Scenes } from "telegraf";
import Excel from "exceljs";

import { INPUT_ABONENTS_LICSHET } from "../../../../../constants.js";

import { keyboards, createInlineKeyboard } from "@lib/keyboards.js";
import { Abonent } from "@models/Abonent.js";
import { Admin, IAdminDocument } from "@models/Admin.js";
import { Company, ICompanyDocument } from "@models/Company.js";
import { HybridMail } from "@models/HybridMail.js";

import { handleTelegramExcel } from "../../../smallFunctions/handleTelegramExcel.js";
import isCancel from "../../../smallFunctions/isCancel.js";
import ejs from "ejs";
import path from "path";

import { createTozaMakonApi } from "@api/tozaMakon.js";

import { createHybridPochtaApi } from "@api/hybridPochta.js";

import { WizardWithState } from "@bot/helpers/WizardWithState.js";
import { validationInputData } from "./validationInputData.js";
import { isCallbackQueryMessage } from "../../utils/validator.js";
import { ErrorTypes } from "@bot/utils/errorHandler.js";
import creatingWarningQueue from "./creatingWarningQueue.js";
import PDFMerger from "pdf-merger-js";
import { getHybridMailChek } from "@services/hybrydPost/getHybridMailChek.js";

interface Mail {
  hybridMailId: number;
  _id: string;
  licshet: string;
  residentId: number;
  createdOn: Date;
  isCharged: boolean;
  isDeleted: boolean;
  isSent: boolean;
  receiver: string;
  isSavedBilling: boolean;
  warning_amount: number;
  type: "ogohlantirish_by_tg_bot";
  abonent_deleted: boolean;
  mahallaId: number;
  companyId: number;
  SentOn: Date | null;
  sud_process_id_billing: string;
}

interface MyWizardState {
  company?: ICompanyDocument;
  admin?: IAdminDocument;
  abonents?: {
    id: number;
    licshet: string;
  }[];
  mails?: Mail[];
}
export type Ctx = WizardWithState<MyWizardState>;

export const sendWarningLettersByHybrid = new Scenes.WizardScene<Ctx>(
  "Ogohlantish xati yuborish",
  async (ctx) => {
    const admin = (await Admin.findOne({
      user_id: ctx.from?.id,
    })) as IAdminDocument;
    if (!admin) return ctx.reply("Sizning adminlik huquqingiz yoq");
    const company = (await Company.findOne({
      id: admin.companyId,
    }).select([
      "id",
      "hybridLogin",
      "hybridRegion",
      "hybridArea",
    ])) as ICompanyDocument;
    if (!company) return ctx.reply("Company not found");

    if (!company.hybridLogin)
      return await ctx.reply("Hybrid pochta logini yo'q");

    ctx.wizard.state.company = company;
    ctx.wizard.state.admin = admin;
    ctx.wizard.state.abonents = [];
    ctx.wizard.state.mails = [];

    await ctx.replyWithDocument(INPUT_ABONENTS_LICSHET, {
      caption:
        "Excel faylni kiriting. Xat yuborilishi kerak bo'lgan abonentlar shaxsiy hisob raqamlarini B ustuniga joylashtiring.",
      reply_markup: keyboards.cancelBtn.reply_markup,
    });
    ctx.wizard.next();
  },
  async (ctx) => {
    try {
      const tozaMakonApi = createTozaMakonApi(
        ctx.wizard.state.admin?.companyId
      );
      const hybridPochtaApi = createHybridPochtaApi(
        ctx.wizard.state.admin?.companyId
      );
      const jsonData = await handleTelegramExcel(ctx);
      // validations
      if (!jsonData || !jsonData.length) {
        return ctx.replyWithHTML(`Xatolik! Faylda hisob raqamlar topilmadi`);
      }

      const checkingResults = await validationInputData(ctx, jsonData);

      if (checkingResults.find((el) => !el.ok)) {
        const workbook = new Excel.Workbook();
        const worksheet = workbook.addWorksheet("Sheet1");

        worksheet.columns = [
          { header: "№", key: "id", width: 10 },
          { header: "Hisob raqam", key: "accountNumber", width: 20 },
          { header: "Xatolik", key: "message", width: 30 },
        ];

        checkingResults.forEach((el, i) => {
          worksheet.addRow({
            id: i + 1,
            accountNumber: el.accountNumber,
            message: el.message,
          });
        });
        await ctx.replyWithDocument(
          {
            source: Buffer.from(await workbook.xlsx.writeBuffer()),
            filename: "xatoliklar.xlsx",
          },
          {
            caption: "Xatolik aniqlandi. Excel faylni ko'zdan kechiring.",
          }
        );
        ctx.scene.leave();
        return;
      }

      const message = await ctx.reply(
        `Ogohlantirish xatlari yaratilmoqda 0 / ${checkingResults.length}`
      );

      await creatingWarningQueue(
        tozaMakonApi,
        hybridPochtaApi,
        {
          Region: ctx.wizard.state.company?.hybridRegion.toString() as string,
          Area: ctx.wizard.state.company?.hybridArea.toString() as string,
        },
        checkingResults,
        ctx.wizard.state.admin?.companyId as number,
        ctx,
        message.message_id
      );
      await ctx.replyWithHTML(
        `Xatlar gibrit pochta bazasiga jo'natildi. <a href="https://hybrid.pochta.uz/#/main/mails/listing/draft?sortBy=createdOn&sortDesc=true&page=1&itemsPerPage=50">Saytga</a> kirib ularni tasdiqlashingiz kerak`,
        createInlineKeyboard([[["Tekshirish 🔄", "refresh"]]])
      );
      ctx.wizard.next();
    } catch (error: any) {
      ctx.reply(error.message);
      console.error(error);
    }
  },
  async (ctx) => {
    if (!isCallbackQueryMessage(ctx)) throw ErrorTypes.BAD_REQUEST;
    if (ctx.callbackQuery?.data !== "refresh")
      return await ctx.replyWithHTML(
        `Xatlar gibrit pochta bazasiga jo'natildi. <a href="https://hybrid.pochta.uz/#/main/mails/listing/draft?sortBy=createdOn&sortDesc=true&page=1&itemsPerPage=50">Saytga</a> kirib ularni tasdiqlashingiz kerak`,
        createInlineKeyboard([[["Tekshirish 🔄", "refresh"]]])
      );

    const results = [];
    const hybridPochtaApi = createHybridPochtaApi(
      ctx.wizard.state.admin?.companyId
    );
    if (!ctx.wizard.state.mails) throw ErrorTypes.NOT_FOUND;
    for (const mail of ctx.wizard.state.mails) {
      const mailData = (
        await hybridPochtaApi.get("/mail", {
          params: {
            id: mail.hybridMailId,
          },
        })
      ).data;
      if (mailData.IsSent) {
        results.push(mailData);
        await HybridMail.findByIdAndUpdate(mail._id, {
          $set: {
            isSent: true,
            sentOn: mail.SentOn,
          },
        });
      }
    }
    await ctx.replyWithHTML(
      `Tasdiqlangan xatlar: ${results.length} / ${ctx.wizard.state.mails.length}`
    );

    const notSend = results.find((r) => r.SendStatus === 0);
    if (!notSend) {
      return ctx.replyWithHTML(
        `<code>EHM${notSend.Id}</code> hali imzolanmagan`
      );
    }
    await ctx.deleteMessage();
    await ctx.reply(
      "Hammasi jonatildi. Ruxsat bersangiz hisobga olishning yagona elektron tizimiga ham pochta kvitansiyalarini yuklab qo'yar edim",
      createInlineKeyboard([[["Billingga yuklash ⬆️", "uploadToBilling"]]])
    );
    return ctx.wizard.next();
  },
  async (ctx) => {
    if (!isCallbackQueryMessage(ctx)) throw "400 bad request";
    if (ctx.callbackQuery?.data !== "uploadToBilling")
      return await ctx.reply(
        "Hammasi jonatildi. Ruxsat bersangiz hisobga olishning yagona elektron tizimiga ham pochta kvitansiyalarini yuklab qo'yar edim",
        createInlineKeyboard([[["Billingga yuklash ⬆️", "uploadToBilling"]]])
      );
    const tozaMakonApi = createTozaMakonApi(ctx.wizard.state.admin?.companyId);
    const hybridPochtaApi = createHybridPochtaApi(
      ctx.wizard.state.admin?.companyId
    );

    let counter = 0;
    const { message_id } = await ctx.reply(
      `Billingga yuklanmoqda 0 / ${ctx.wizard.state.mails?.length}`
    );
    for (const row of ctx.wizard.state.mails as Mail[]) {
      const pdf = await hybridPochtaApi.get(`/PdfMail/` + row.hybridMailId, {
        responseType: "arraybuffer",
      });
      const buffer = Buffer.from(pdf.data);
      const mail = (
        await hybridPochtaApi.get("/mail", {
          params: {
            id: row.hybridMailId,
          },
        })
      ).data;
      const chekPDF = await getHybridMailChek(
        ctx.wizard.state.admin?.companyId as number,
        row.hybridMailId
      );

      const merger = new PDFMerger();
      await merger.add(buffer);
      await merger.add(chekPDF);
      await merger.setMetadata({
        producer: "oliy ong",
        author: "Shamshod Nematullayev",
        creator: "Toza Hudud bot",
        title: "Ogohlantirish xati",
      });
      const bufferWarningWithCash = await merger.saveAsBuffer();
      const formData = new FormData();

      const uint8 = new Uint8Array(bufferWarningWithCash);
      const blob = new Blob([uint8], { type: "application/pdf" });
      formData.append("file", blob, row.hybridMailId + `.pdf`);
      const fileUploadBilling = (
        await tozaMakonApi.post("/file-service/buckets/upload", formData, {
          params: {
            folderType: "SUD_PROCESS",
          },
          headers: { "Content-Type": "multipart/form-data" },
        })
      ).data;
      await tozaMakonApi.post(
        "/user-service/court-processes/" +
          row.sud_process_id_billing +
          "/add-file",
        {
          description: `warning letter by hybrid`,
          fileName: `${fileUploadBilling.fileName}*${fileUploadBilling.fileId}`,
          fileType: "WARNING_FILE",
        }
      );

      await HybridMail.findByIdAndUpdate(row._id, {
        $set: {
          isSavedBilling: true,
          sud_process_id_billing: row.sud_process_id_billing,
        },
      });
      await Abonent.findOneAndUpdate(
        {
          licshet: row.licshet,
          companyId: ctx.wizard.state.admin?.companyId,
        },
        {
          $set: {
            warningLetter: {
              id: row._id,
              createdDate: new Date(),
            },
          },
        }
      );
      await ctx.telegram.editMessageText(
        ctx.chat?.id,
        message_id,
        undefined,
        `Billingga yuklanmoqda ${++counter} / ${ctx.wizard.state.mails?.length}`
      );
    }
    await ctx.reply("Billingga yuklab bo'ldim.");
    return ctx.scene.leave();
  }
);

sendWarningLettersByHybrid.on("text", (ctx, next) => {
  if (isCancel(ctx.message.text)) {
    ctx.reply("Bekor qilindi", keyboards.adminKeyboard.resize());
    return ctx.scene.leave();
  }
  return next();
});

sendWarningLettersByHybrid.leave((ctx) => {
  ctx.reply("Asosiy menyu", keyboards.adminKeyboard.resize());
});
