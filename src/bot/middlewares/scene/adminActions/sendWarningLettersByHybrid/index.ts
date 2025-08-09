import { Scenes } from "telegraf";
import Excel from "exceljs";

import { INPUT_ABONENTS_LICSHET } from "../../../../../constants.js";

import { keyboards, createInlineKeyboard } from "@lib/keyboards.js";
import { Abonent, IAbonentDoc } from "@models/Abonent.js";
import { Admin, IAdminDocument } from "@models/Admin.js";
import { Company, ICompanyDocument } from "@models/Company.js";
import { HybridMail, IHybridMailDocument } from "@models/HybridMail.js";

import { handleTelegramExcel } from "../../../smallFunctions/handleTelegramExcel.js";
import isCancel from "../../../smallFunctions/isCancel.js";
import ejs from "ejs";
import path from "path";

import PDFMerger from "pdf-merger-js";
import { createTozaMakonApi } from "@api/tozaMakon.js";

import { createHybridPochtaApi } from "@api/hybridPochta.js";

import FormData from "form-data";
import puppeteer from "puppeteer";
import { WizardWithState } from "@bot/helpers/WizardWithState.js";
import { createWarningLetterPDF } from "../../utils/createWarningLetterPDF.js";
import { getAbonentById } from "@services/billing/getAbonentById.js";
import { validationInputData } from "./validationInputData.js";
import { isCallbackQueryMessage } from "../../utils/validator.js";
import { createPdfMail } from "@services/hybrydPost/createPdfMail.js";
import { ErrorTypes } from "@bot/utils/errorHandler.js";

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
          },
          {
            caption: "Xatolik aniqlandi. Excel faylni ko'zdan kechiring.",
          }
        );
        return;
      }

      const message = await ctx.reply(
        `Ogohlantirish xatlari yaratilmoqda 0 / ${checkingResults.length}`
      );
      let counter = 0;
      for (const abonent of checkingResults) {
        try {
          const abonentDetails = await getAbonentById(
            tozaMakonApi,
            abonent.residentId
          );
          const base64Batch = await createWarningLetterPDF(
            abonentDetails,
            ctx.wizard.state.admin?.companyId as number
          );
          const newMail = await createPdfMail(hybridPochtaApi, {
            Address: `${abonentDetails.mahallaName}, ${abonentDetails.streetName}`,
            Receiver: abonentDetails.fullName,
            Document64: base64Batch,
            Region: ctx.wizard.state.company?.hybridRegion.toString() as string, //viloyat
            Area: ctx.wizard.state.company?.hybridArea.toString() as string, // tuman
          });

          const newMailOnDB = await HybridMail.create({
            licshet: abonent.accountNumber,
            type: "ogohlantirish_by_tg_bot",
            hybridMailId: newMail.Id,
            createdOn: new Date(),
            receiver: abonentDetails.fullName,
            warning_date_billing: new Date(),
            companyId: ctx.wizard.state.admin?.companyId,
            residentId: abonent.residentId,
          });
          ctx.wizard.state.mails?.push({
            hybridMailId: newMail.Id,
            _id: newMailOnDB._id.toString(),
            licshet: abonentDetails.accountNumber,
            residentId: abonent.residentId,
            createdOn: new Date(),
            isCharged: false,
            isDeleted: false,
            isSent: false,
            receiver: abonentDetails.fullName,
            isSavedBilling: false,
            warning_amount: abonentDetails.balance.kSaldo,
            type: "ogohlantirish_by_tg_bot",
            abonent_deleted: false,
            mahallaId: abonentDetails.mahallaId,
            companyId: ctx.wizard.state.admin?.companyId as number,
            SentOn: newMail.SentOn,
          });
          counter++;
          await ctx.telegram.editMessageText(
            ctx.chat?.id,
            message.message_id,
            undefined,
            `Ogohlantirish xatlari yaratilmoqda ${counter} / ${checkingResults.length}`
          );
        } catch (error: any) {
          ctx.reply(error.message);
          console.error(error);
        }
      }
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
      const html = (await new Promise(async (resolve, reject) => {
        ejs.renderFile(
          path.join(process.cwd(), "src", "views", "hybridPochtaCash.ejs"),
          { mail },
          async (err, html) => {
            if (err) return reject(err);
            return resolve(html);
          }
        );
      })) as string;
      const browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
        userDataDir: "/tmp/puppeteer",
      });

      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "networkidle0" });
      const bufferCash = await page.pdf({
        format: "A4",
        printBackground: true,
      });
      await page.close();

      const merger = new PDFMerger();
      await merger.add(buffer);
      await merger.add(bufferCash);
      await merger.setMetadata({
        producer: "oliy ong",
        author: "Shamshod Nematullayev",
        creator: "Toza Hudud bot",
        title: "Ogohlantirish xati",
      });
      const bufferWarningWithCash = await merger.saveAsBuffer();
      const formData = new FormData();
      formData.append("file", bufferWarningWithCash, row.hybridMailId + `.pdf`);
      const fileUploadBilling = (
        await tozaMakonApi.post("/file-service/buckets/upload", formData, {
          params: {
            folderType: "SUD_PROCESS",
          },
          headers: { "Content-Type": "multipart/form-data" },
        })
      ).data;
      // await tozaMakonApi.post(
      //   "/user-service/court-processes/" + row.courtWarning_id + "/add-file",
      //   {
      //     description: `warning letter by hybrid`,
      //     fileName: `${fileUploadBilling.fileName}*${fileUploadBilling.fileId}`,
      //     fileType: "WARNING_FILE",
      //   }
      // );

      // await HybridMail.findByIdAndUpdate(row._id, {
      //   $set: {
      //     isSavedBilling: true,
      //     sud_process_id_billing: row.courtWarning_id,
      //   },
      // });
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
