const { Scenes } = require("telegraf");
const {
  createMail,
  getOneMailById,
  getPdf,
} = require("../../../api/hybrid.pochta.uz");
const { INPUT_ABONENTS_LICSHET } = require("../../../constants");
const { createInlineKeyboard } = require("../../../lib/keyboards");
const { HybridMail } = require("../../../models/HybridMail");
const { keyboards, getAbonentSaldoData } = require("../../../requires");
const {
  handleTelegramExcel,
} = require("../../smallFunctions/handleTelegramExcel");
const isCancel = require("../../smallFunctions/isCancel");
const ejs = require("ejs");
const path = require("path");

const htmlPDF = require("html-pdf");
const { enterWarningLetterToBilling } = require("../../../api/cleancity/dxsh");
const PDFMerger = require("pdf-merger-js");

// required small functions
function bugungiSana() {
  const date = new Date();
  return `${date.getDate()}.${
    date.getMonth() + 1 < 10 ? "0" + (date.getMonth() + 1) : date.getMonth() + 1
  }.${date.getFullYear()}`;
}

async function createWarningLetterPDF(licshet) {
  const abonentData = await getAbonentSaldoData(licshet);
  if (!abonentData)
    return { success: false, message: "Abonent data not found" };
  const data = {
    FISH: abonentData.fio,
    MFY: abonentData.mahalla_name,
    STREET: abonentData.streets_name,
    KOD: abonentData.licshet,
    SALDO: abonentData.saldo_k,
    SANA: bugungiSana(),
  };
  const createHtmlString = new Promise((resolve, reject) => {
    ejs.renderFile(
      path.join(__dirname, "../../../", "views", "gibrid.ogohlantirish.ejs"),
      { data },
      {},
      (err, str) => {
        if (err) return reject(err);
        resolve(str);
      }
    );
  });

  const html = await createHtmlString;
  const convertPDF = new Promise((resolve, reject) => {
    htmlPDF
      .create(html, { format: "A4", orientation: "portrait" })
      .toBuffer((err, str) => {
        if (err) return reject(err);
        const base64PDF = str.toString("base64");
        resolve({ success: true, data: base64PDF });
      });
  });
  return await convertPDF;
}

const sendWarningLettersByHybrid = new Scenes.WizardScene(
  "Ogohlantish xati yuborish",
  async (ctx) => {
    try {
      const jsonData = await handleTelegramExcel(ctx);
      const arrayMails = [];
      let i = 0;
      const loop = async () => {
        if (i == jsonData.length) return;
        const row = jsonData[i];
        const licshet = row[Object.keys(row)[1]];
        if (licshet === undefined) {
          return ctx.reply(`${i + 2}-qatorda licshet topilmadi`);
        }
        const mail = await HybridMail.findOne({ licshet });
        if (mail) return { ok: false, message: "Mail already exists" };
        const abonentData = await getAbonentSaldoData(licshet);
        const base64PDF = await createWarningLetterPDF(licshet);
        if (!base64PDF.success) {
          return ctx.reply(base64PDF.message);
        }
        const newMail = await createMail(
          `${abonentData.mahalla_name}, ${abonentData.streets_name}`,
          abonentData.fio,
          base64PDF.data
        );
        const newMailOnDB = await HybridMail.create({
          licshet: licshet,
          type: "ogohlantirish_by_tg_bot",
          hybridMailId: newMail.Id,
          createdOn: new Date(),
          receiver: abonentData.fio,
        });
        arrayMails.push({
          mail_id: newMail.Id,
          _id: newMailOnDB._id,
          licshet: licshet,
        });
        i++;
        await loop();
      };
      await loop();

      ctx.replyWithHTML(
        `Xatlar gibrit pochta bazasiga jo'natildi. <a href="https://hybrid.pochta.uz/#/main/mails/listing/draft?sortBy=createdOn&sortDesc=true&page=1&itemsPerPage=50">Saytga</a> kirib ularni tasdiqlashingiz kerak`,
        createInlineKeyboard([[["Tekshirish 🔄", "refresh"]]])
      );
      ctx.wizard.state.arrayMails = arrayMails;
      ctx.wizard.next();
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
      if (counter == ctx.wizard.state.arrayMails.length) return;
      console.log(counter);
      const row = ctx.wizard.state.arrayMails[counter];
      const response = await getOneMailById(row.mail_id);
      results.push(response);
      if (response.IsSent) {
        await HybridMail.findByIdAndUpdate(row._id, {
          $set: { isSent: true, sentOn: response.SentOn },
        });
      }
      counter++;
      await loop();
    }
    await loop();
    let jonatilmagan;
    const hammasiJonatildi = results.every((result) => {
      jonatilmagan = result;
      return result.IsSent;
    });
    if (!hammasiJonatildi) {
      return ctx.replyWithHTML(
        `<code>EHM${jonatilmagan.Id}</code> hali imzolanmagan`
      );
    }
    ctx.deleteMessage();
    await ctx.reply(
      "Hammasi jonatildi. Ruxsat bersangiz hisobga olishning yagona elektron tizimiga ham pochka kvitansiyalarini yuklab qo'yar edim",
      createInlineKeyboard([[["Billingga yuklash ⬆️", "uploadToBilling"]]])
    );
    return ctx.wizard.next();
  },
  async (ctx) => {
    if (ctx.update.callback_query?.data !== "uploadToBilling")
      return await ctx.reply(
        "Hammasi jonatildi. Ruxsat bersangiz hisobga olishning yagona elektron tizimiga ham pochka kvitansiyalarini yuklab qo'yar edim",
        createInlineKeyboard([[["Billingga yuklash ⬆️", "uploadToBilling"]]])
      );
    ctx.reply("Tekshirish");
    let counter = 0;
    async function loop() {
      if (counter == ctx.wizard.state.arrayMails.length) return;
      const row = ctx.wizard.state.arrayMails[counter];
      const response = await getOneMailById(row.mail_id);
      const pdf = await getPdf(row.mail_id);
      if (!pdf.ok) return { success: false, message: pdf.err };

      ejs.renderFile(
        "./views/hybridPochtaCash.ejs",
        { mail: { ...response } },
        (err, str) => {
          if (err) return console.error(err);

          htmlPDF
            .create(str, { format: "A4", orientation: "portrait" })
            .toFile(
              "./uploads/cash" + row.mail_id + ".pdf",
              async (err, res) => {
                if (err) return console.error(err);

                let merger = new PDFMerger();
                const convert = async () => {
                  await merger.add(pdf.filename);

                  await merger.add("./uploads/cash" + row.mail_id + ".pdf");

                  // Set metadata
                  await merger.setMetadata({
                    producer: "oliy ong",
                    author: "Shamshod Nematullayev",
                    creator: "Toza Hudud bot",
                    title: "Ogohlantirish xati",
                  });
                  await merger.save(
                    `./uploads/ogohlantirish_xati${row.licshet}.PDF`
                  );
                };
                await convert();
                const response = await enterWarningLetterToBilling({
                  lischet: row.lischet,
                  comment: "Gibrit pochta orqali yuborilgan ogohlantirish xati",
                  qarzdorlik: abonentData.saldo_k,
                  sana: bugungiSana(),
                  file_path: `./uploads/ogohlantirish_xati${row.licshet}.PDF`,
                });

                if (response.success) {
                  // await HybridMail.findByIdAndUpdate(row._id, {
                  //   $set: { isSavedBilling: true },
                  // });
                }
              }
            );
        }
      );

      // counter++;
      // await loop();
    }
    await loop();
  }
);

sendWarningLettersByHybrid.enter((ctx) => {
  ctx.replyWithDocument(INPUT_ABONENTS_LICSHET, {
    caption:
      "Excel faylni kiriting. Xat yuborilishi kerak bo'lgan abonentlar shaxsiy hisob raqamlarini A ustuniga joylashtiring.",
    reply_markup: keyboards.lotin.cancelBtn.reply_markup,
  });
});
sendWarningLettersByHybrid.on("text", (ctx, next) => {
  if (isCancel(ctx.message.text)) {
    ctx.reply("Bekor qilindi", keyboards.lotin.adminKeyboard.resize());
    return ctx.scene.leave();
  }
  next();
});

sendWarningLettersByHybrid.leave((ctx) => {
  ctx.reply("Asosiy menyu", keyboards.lotin.adminKeyboard.resize());
});

module.exports = { sendWarningLettersByHybrid };
