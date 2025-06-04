const { Scenes } = require("telegraf");
const { INPUT_ABONENTS_LICSHET } = require("../../../constants");
const { createInlineKeyboard } = require("../../../lib/keyboards");
const { HybridMail } = require("../../../models/HybridMail");
const { keyboards, Abonent, Admin, Company } = require("../../../requires");
const {
  handleTelegramExcel,
} = require("../../smallFunctions/handleTelegramExcel");
const isCancel = require("../../smallFunctions/isCancel");
const ejs = require("ejs");
const path = require("path");

const PDFMerger = require("pdf-merger-js");
const { createTozaMakonApi } = require("../../../api/tozaMakon");
const { createHybridPochtaApi } = require("../../../api/hybridPochta");
const FormData = require("form-data");
const { default: puppeteer } = require("puppeteer");

const sendWarningLettersByHybrid = new Scenes.WizardScene(
  "Ogohlantish xati yuborish",
  async (ctx) => {
    const admin = await Admin.findOne({ user_id: ctx.from.id });
    if (!admin) return ctx.reply("Sizning adminlik huquqingiz yoq");
    const company = await Company.findOne({
      id: admin.companyId,
    }).select(["id", "hybridLogin", "hybridRegion", "hybridArea"]);
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
      const tozaMakonApi = createTozaMakonApi(ctx.wizard.state.admin.companyId);
      const hybridPochtaApi = createHybridPochtaApi(
        ctx.wizard.state.admin.companyId
      );
      const jsonData = await handleTelegramExcel(ctx);
      // validations
      if (!jsonData.length) {
        return ctx.replyWithHTML(`Xatolik! Faylda hisob raqamlar topilmadi`);
      }

      if (!(await validate(ctx, jsonData))) {
        await ctx.reply("Validatsiyadan o'tmadi");
        return;
      }
      if (ctx.wizard.state.abonents.length == 0)
        return ctx.reply("Abonentlar topilmadi");

      const message = await ctx.reply(
        `Ogohlantirish xatlari yaratilmoqda 0 / ${ctx.wizard.state.abonents.length}`
      );
      let counter = 0;
      for (const abonent of ctx.wizard.state.abonents) {
        try {
          const abonentData = (
            await tozaMakonApi.get("/user-service/residents/" + abonent.id)
          ).data;
          const { base64, courtWarning } = await createWarningLetterPDF(
            abonentData,
            ctx.wizard.state.admin.companyId
          );
          console.log(base64, courtWarning);
          const newMail = (
            await hybridPochtaApi.post("/PdfMail", {
              Address: `${abonentData.mahallaName}, ${abonentData.streetName}`,
              Receiver: abonentData.fullName,
              Document64: base64,
              Region: ctx.wizard.state.company.hybridRegion, //viloyat
              Area: ctx.wizard.state.company.hybridArea, // tuman
            })
          ).data;
          const newMailOnDB = await HybridMail.create({
            licshet: abonent.licshet,
            type: "ogohlantirish_by_tg_bot",
            hybridMailId: newMail.Id,
            createdOn: new Date(),
            receiver: abonentData.fullName,
            warning_date_billing: new Date(),
            companyId: ctx.wizard.state.admin.companyId,
            residentId: abonent.id,
          });
          ctx.wizard.state.mails.push({
            hybridMailId: newMail.Id,
            _id: newMailOnDB._id,
            licshet: abonentData.accountNumber,
            courtWarning_id: courtWarning.id,
          });
          counter++;
          await ctx.telegram.editMessageText(
            ctx.chat.id,
            message.message_id,
            null,
            `Ogohlantirish xatlari yaratilmoqda ${counter} / ${ctx.wizard.state.abonents.length}`
          );
        } catch (error) {
          ctx.reply(error.message);
          console.error(error);
        }
      }
      await ctx.replyWithHTML(
        `Xatlar gibrit pochta bazasiga jo'natildi. <a href="https://hybrid.pochta.uz/#/main/mails/listing/draft?sortBy=createdOn&sortDesc=true&page=1&itemsPerPage=50">Saytga</a> kirib ularni tasdiqlashingiz kerak`,
        createInlineKeyboard([[["Tekshirish 🔄", "refresh"]]])
      );
      ctx.wizard.next();
    } catch (error) {
      ctx.reply(error.message);
      console.error(error);
    }
  },
  async (ctx) => {
    if (ctx.update.callback_query?.data !== "refresh")
      return await ctx.replyWithHTML(
        `Xatlar gibrit pochta bazasiga jo'natildi. <a href="https://hybrid.pochta.uz/#/main/mails/listing/draft?sortBy=createdOn&sortDesc=true&page=1&itemsPerPage=50">Saytga</a> kirib ularni tasdiqlashingiz kerak`,
        createInlineKeyboard([[["Tekshirish 🔄", "refresh"]]])
      );

    const results = [];
    const hybridPochtaApi = createHybridPochtaApi(
      ctx.wizard.state.admin.companyId
    );
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
        await HybridMail.findByIdAndUpdate(row._id, {
          $set: {
            isSent: true,
            sentOn: response.SentOn,
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
    if (ctx.update.callback_query?.data !== "uploadToBilling")
      return await ctx.reply(
        "Hammasi jonatildi. Ruxsat bersangiz hisobga olishning yagona elektron tizimiga ham pochta kvitansiyalarini yuklab qo'yar edim",
        createInlineKeyboard([[["Billingga yuklash ⬆️", "uploadToBilling"]]])
      );
    const tozaMakonApi = createTozaMakonApi(ctx.wizard.state.admin.companyId);
    const hybridPochtaApi = createHybridPochtaApi(
      ctx.wizard.state.admin.companyId
    );

    let counter = 0;
    const { message_id } = await ctx.reply(
      `Billingga yuklanmoqda 0 / ${ctx.wizard.state.mails.length}`
    );
    for (const row of ctx.wizard.state.mails) {
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
      const html = await new Promise(async (resolve, reject) => {
        ejs.renderFile(
          "./views/hybridPochtaCash.ejs",
          { mail },
          async (err, html) => {
            if (err) return reject(err);
            return resolve(html);
          }
        );
      });
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
      await tozaMakonApi.post(
        "/user-service/court-processes/" + row.courtWarning_id + "/add-file",
        {
          description: `warning letter by hybrid`,
          fileName: `${fileUploadBilling.fileName}*${fileUploadBilling.fileId}`,
          fileType: "WARNING_FILE",
        }
      );

      await HybridMail.findByIdAndUpdate(row._id, {
        $set: {
          isSavedBilling: true,
          sud_process_id_billing: row.courtWarning_id,
        },
      });
      await Abonent.findOneAndUpdate(
        {
          licshet: row.licshet,
          companyId: ctx.wizard.state.admin.companyId,
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
        ctx.chat.id,
        message_id,
        null,
        `Billingga yuklanmoqda ${++counter} / ${ctx.wizard.state.mails.length}`
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
  next();
});

sendWarningLettersByHybrid.leave((ctx) => {
  ctx.reply("Asosiy menyu", keyboards.adminKeyboard.resize());
});

module.exports = { sendWarningLettersByHybrid };

// required small functions

async function createWarningLetterPDF(abonentData, companyId) {
  const company = await Company.findOne({ id: companyId });
  const now = new Date();
  const tozaMakonApi = createTozaMakonApi(companyId);
  await tozaMakonApi.post("/user-service/court-warnings/batch", {
    oneWarningInOnePage: true,
    residentIds: [abonentData.id],
    warningBasis: `${abonentData.balance.kSaldo.toLocaleString()} soʻm qarzdor`,
    warningDate: `${now.getFullYear()}-${
      now.getMonth() < 9 ? "0" + (now.getMonth() + 1) : now.getMonth() + 1
    }-${now.getDate()}`,
  });
  const courtWarning = (
    await tozaMakonApi.get("/user-service/court-warnings", {
      params: {
        litigationStatus: "NEW",
        status: "NEW",
        districtId: company.districtId,
        page: 0,
        size: 1,
        accountNumber: abonentData.accountNumber,
      },
    })
  ).data.content[0];
  const warningDataPrint = (
    await tozaMakonApi.get(
      "/user-service/court-warnings/" + courtWarning.id + "/print"
    )
  ).data;

  const html = await new Promise((resolve, reject) => {
    ejs.renderFile(
      path.join(__dirname, "../../../", "views", "gibrid.ogohlantirish.ejs"),
      { warningDataPrint },
      {},
      (err, str) => {
        if (err) return reject(err);
        resolve(str);
      }
    );
  });
  const convertPDF = new Promise(async (resolve, reject) => {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      userDataDir: "/tmp/puppeteer",
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const buffer = await page.pdf({
      format: "letter",
      printBackground: true,
    });
    const newBuffer = Buffer.from(buffer);
    await page.close();
    resolve({
      base64: newBuffer.toString("base64"),
      courtWarning,
    });
  });
  return await convertPDF;
}

async function validate(ctx, jsonData) {
  let qator = 1;
  const message = await ctx.reply(`Tekshilmoqda 0 / ${jsonData.length}`);
  for (const row of jsonData) {
    qator++;
    const licshet = row[Object.keys(row)[1]];
    console.log(licshet);
    if (licshet === undefined) {
      ctx.reply(`${qator}-qatorda hisob raqami topilmadi`);
      return false;
    }
    const abonent = await Abonent.findOne({
      licshet,
      companyId: ctx.wizard.state.admin.companyId,
    }).lean();
    if (!abonent) {
      ctx.reply(`${licshet} hisob raqamli abonent topilmadi`);
      return false;
    }
    const now = new Date();
    const oltiOyAvval = new Date(now.getFullYear(), now.getMonth() - 6, 1);
    const mail = await HybridMail.findOne({
      licshet,
      warning_date_billing: {
        $gte: oltiOyAvval,
        $lt: now,
      },
    });
    if (mail) {
      await ctx.reply(
        `${mail.licshet} hisob raqamiga oxirgi 6 oy ichida allaqachon ogohlantirish xati yuborilgan`
      );
      return false;
    }
    ctx.wizard.state.abonents.push({ id: abonent.id, licshet });
    await ctx.telegram.editMessageText(
      ctx.chat.id,
      message.message_id,
      null,
      `Tekshirilmoqda ${qator - 1} / ${jsonData.length}`
    );
  }
  return true;
}
