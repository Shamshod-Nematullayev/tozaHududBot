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

// const htmlPDF = require("html-pdf");
const PDFMerger = require("pdf-merger-js");
const { createTozaMakonApi } = require("../../../api/tozaMakon");
const { hybridPochtaApi } = require("../../../api/hybridPochta");
const FormData = require("form-data");
const { default: puppeteer } = require("puppeteer");

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
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const buffer = await page.pdf({
      format: "letter",
      printBackground: true,
    });
    await page.close();
    resolve({
      base64: buffer.toString("base64"),
      courtWarning,
    });
  });
  return await convertPDF;
}

const sendWarningLettersByHybrid = new Scenes.WizardScene(
  "Ogohlantish xati yuborish",
  async (ctx) => {
    try {
      const admin = await Admin.findOne({ user_id: ctx.from.id });
      if (!admin) return ctx.reply("Sizning adminlik huquqingiz yoq");
      ctx.wizard.state.admin = admin;
      const jsonData = await handleTelegramExcel(ctx);
      const arrayMails = [];
      // validations
      if (!jsonData.length) {
        return ctx.replyWithHTML(`Xatolik! Faylda hisob raqamlar topilmadi`);
      }
      async function validate() {
        let qator = 1;
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
            companyId: admin.companyId,
          }).lean();
          if (!abonent) {
            ctx.reply(`${licshet} hisob raqamli abonent topilmadi`);
            return false;
          }
          const now = new Date();
          const oltiOyAvval = new Date(
            now.getFullYear(),
            now.getMonth() - 6,
            1
          );
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
        }
        return true;
      }
      ctx.wizard.state.abonents = [];
      if (!(await validate())) {
        await ctx.reply("Validatsiyadan o'tmadi");
        return;
      }
      if (ctx.wizard.state.abonents.length == 0)
        return ctx.reply("Abonentlar topilmadi");
      const company = await Company.findOne({ id: admin.companyId });
      const tozaMakonApi = createTozaMakonApi(admin.companyId);
      for (const abonent of ctx.wizard.state.abonents) {
        try {
          const abonentData = (
            await tozaMakonApi.get("/user-service/residents/" + abonent.id)
          ).data;
          const { base64, courtWarning } = await createWarningLetterPDF(
            abonentData
          );
          const newMail = (
            await hybridPochtaApi.post("/PdfMail", {
              Address: `${abonentData.mahallaName} ${abonentData.streetName}`,
              Receiver: abonentData.fullName,
              Document64: base64,
              Region: company.hybridRegion, //viloyat
              Area: company.hybridArea, // tuman
            })
          ).data;
        } catch (error) {
          ctx.reply(error.message);
          console.error(error);
        }
      }

      let i = 0;
      const loop = async () => {
        console.log(i);
        try {
          if (i == jsonData.length) {
            ctx.replyWithHTML(
              `Xatlar gibrit pochta bazasiga jo'natildi. <a href="https://hybrid.pochta.uz/#/main/mails/listing/draft?sortBy=createdOn&sortDesc=true&page=1&itemsPerPage=50">Saytga</a> kirib ularni tasdiqlashingiz kerak`,
              createInlineKeyboard([[["Tekshirish 🔄", "refresh"]]])
            );
            ctx.wizard.state.arrayMails = arrayMails;
            ctx.wizard.next();
            return;
          }
          const row = jsonData[i];
          const licshet = row[Object.keys(row)[1]];
          const abonent = await Abonent.findOne({});
          const abonentData = (
            await tozaMakonApi.get("/user-service/residents/" + abonent.id)
          ).data;
          const { base64, courtWarning } = await createWarningLetterPDF(
            abonentData
          );
          const newMail = (
            await hybridPochtaApi.post("/PdfMail", {
              Address: `${abonentData.mahallaName} ${abonentData.streetName}`,
              Receiver: abonentData.fullName,
              Document64: base64,
              Region: 3, //Samarqand viloyati
              Area: 41, // Kattaqo'rg'on tumani
            })
          ).data;
          const newMailOnDB = await HybridMail.create({
            licshet: licshet,
            type: "ogohlantirish_by_tg_bot",
            hybridMailId: newMail.Id,
            createdOn: new Date(),
            receiver: abonentData.fullName,
            warning_date_billing: new Date(),
            warning_amount: abonentData.balance.kSaldo,
            sud_process_id_billing: courtWarning.id,
          });
          arrayMails.push({
            hybridMailId: newMail.Id,
            _id: newMailOnDB._id,
            licshet: licshet,
            courtWarning_id: courtWarning.id,
          });
          i++;
          console.log(i);
          loop();
        } catch (error) {
          ctx.reply(error.message);
          console.error(error);
        }
      };
      loop();
    } catch (e) {
      console.error(e);
    }
  },
  async (ctx) => {
    if (ctx.update.callback_query?.data !== "refresh") {
      return await ctx.replyWithHTML(
        `Xatlar gibrit pochta bazasiga jo'natildi. <a href="https://hybrid.pochta.uz/#/main/mails/listing/draft?sortBy=createdOn&sortDesc=true&page=1&itemsPerPage=50">Saytga</a> kirib ularni tasdiqlashingiz kerak`,
        createInlineKeyboard([[["Tekshirish 🔄", "refresh"]]])
      );
    }
    let counter = 0;
    const results = [];
    async function loop() {
      if (counter == ctx.wizard.state.arrayMails.length) {
        ctx.replyWithHTML(
          `Tasdiqlangan xatlar: ${results.length} / ${ctx.wizard.state.arrayMails.length}`
        );
        return;
      }
      const row = ctx.wizard.state.arrayMails[counter];
      const mail = (
        await hybridPochtaApi.get("/mail", {
          params: {
            id: row.hybridMailId,
          },
        })
      ).data;
      results.push(mail);
      if (mail.IsSent) {
        await HybridMail.findByIdAndUpdate(row._id, {
          $set: { isSent: true, sentOn: response.SentOn },
        });
      }
      counter++;
      console.log(counter);
      await loop();
    }
    await loop();
    let jonatilmagan;
    const hammasiJonatildi = results.every((result) => {
      jonatilmagan = result;
      return result.SendStatus === 0;
    });
    if (!hammasiJonatildi) {
      return ctx.replyWithHTML(
        `<code>EHM${jonatilmagan.Id}</code> hali imzolanmagan`
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
    ctx.reply("Tekshirish");
    let counter = 0;
    const tozaMakonApi = createTozaMakonApi(ctx.wizard.state.admin.companyId);
    async function loop() {
      if (counter == ctx.wizard.state.arrayMails.length) {
        await ctx.reply("Billingga yuklab bo'ldim.");
        return ctx.scene.leave();
      }
      const row = ctx.wizard.state.arrayMails[counter];
      const existMail = await HybridMail.findById(row._id);
      if (existMail.isSavedBilling) {
        counter++;
        loop();
        return;
      }
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
      ejs.renderFile(
        "./views/hybridPochtaCash.ejs",
        { mail },
        async (err, str) => {
          if (err) return console.error(err);

          const browser = await puppeteer.launch({
            headless: true,
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
          });

          const page = await browser.newPage();
          await page.setContent(str, { waitUntil: "networkidle0" });
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
          formData.append(
            "file",
            bufferWarningWithCash,
            row.hybridMailId + `.pdf`
          );
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
              row.courtWarning_id +
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
              sud_process_id_billing: row.courtWarning_id,
            },
          });
          counter++;
        }
      );
    }
    await loop();
  }
);

sendWarningLettersByHybrid.enter((ctx) => {
  ctx.replyWithDocument(INPUT_ABONENTS_LICSHET, {
    caption:
      "Excel faylni kiriting. Xat yuborilishi kerak bo'lgan abonentlar shaxsiy hisob raqamlarini A ustuniga joylashtiring.",
    reply_markup: keyboards.cancelBtn.reply_markup,
  });
});
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
