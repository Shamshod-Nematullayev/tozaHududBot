const { Scenes } = require("telegraf");
const fs = require("fs");
const https = require("https");
const excelToJson = require("convert-excel-to-json");
const {
  INPUT_ALERT_LETTER_TO_BILLING_EXCEL,
} = require("../../../../../constants");
const isCancel = require("../../../../smallFunctions/isCancel");
const { keyboards } = require("../../../../../lib/keyboards");

const importAlertLetters = new Scenes.WizardScene(
  "importAlertLetters",
  async (ctx) => {
    try {
      if (!ctx.message.document)
        return ctx.reply(
          "Siz fayl kiritmadingiz",
          keyboards.lotin.cancelBtn.resize()
        );
      if (
        ctx.message.document.mime_type !== "application/vnd.ms-excel" &&
        ctx.message.document.mime_type !==
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      ) {
        return ctx.reply(
          "Siz excel fayl kiritmadingiz",
          keyboards.lotin.cancelBtn.resize()
        );
      }

      const xlsxTelegram = await ctx.telegram.getFileLink(
        ctx.message.document.file_id
      );
      const filenameXLSX = `./importAlertLetters${Date.now()}.xlsx`;
      const writeStream = fs.createWriteStream(filenameXLSX);
      https.get(xlsxTelegram.href, (res) => {
        res.pipe(writeStream);
        writeStream.on("finish", async (cb) => {
          const rows = excelToJson({
            sourceFile: filenameXLSX,
          });
          const sheet = rows[Object.keys(rows)[0]];
          sheet.shift();
          await ctx.reply(
            `Qabul qilindi. Endi ro'yxatdagi abonentlarning ogohlantirish xatlari fayllarini menga arxiv shaklida yuboring. Fayllarni ajratib olishim uchun ularni shaxsiy hisob raqami bilan nomlangz`
          );
          ctx.wizard.next();
        });
      });
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  },
  async (res) => {
    try {
      if (!ctx.message.document)
        return ctx.reply(
          "Siz fayl kiritmadingiz",
          keyboards.lotin.cancelBtn.resize()
        );
      if (ctx.message.document.mime_type !== "application/zip")
        return ctx.reply(
          "Siz zip arxiv faylini kiritmadingiz",
          keyboards.lotin.cancelBtn.resize()
        );

      const dirname = "./uploads/process" + Date.now();
      fs.mkdir(dirname, (err) => {
        if (err) throw err;
      });
      const zipFileTelegramPath = await ctx.telegram.getFileLink(
        ctx.message.document.file_id
      );
      const filename = `./uploads/process${Date.now()}.zip`;
      const zipFileStream = fs.createWriteStream(filename);
      https.get(zipFileTelegramPath.href, (res) => {
        res.pipe(zipFileStream);
      });
      zipFileStream.on("finish", async (cb) => {
        await compressing.zip.uncompress(filename, dirname);
        fs.readdir(dirname, async (err, files) => {
          if (err) throw err;
        });
      });
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  }
);

importAlertLetters.on("text", (ctx, next) => {
  if (isCancel(ctx.message.text)) {
    ctx.reply("Bekor qilindi");
    return ctx.scene.leave();
  } else next();
});

importAlertLetters.enter((ctx) => {
  ctx.replyWithDocument(INPUT_ALERT_LETTER_TO_BILLING_EXCEL, {
    caption:
      "Kerakli ma'lumotlarni mazkur excel jadvalga joylashtirib menga yuboring. 200 dona dan ko'p kiritmaslik tavsiya e'tiladi.",
  });
});

module.exports = { importAlertLetters };
