const { Scenes } = require("telegraf");
const fs = require("fs");
const https = require("https");
const excelToJson = require("convert-excel-to-json");
const {
  INPUT_ALERT_LETTER_TO_BILLING_EXCEL,
} = require("../../../../../constants");
const isCancel = require("../../../../smallFunctions/isCancel");
const {
  keyboards,
  createInlineKeyboard,
} = require("../../../../../lib/keyboards");
const {
  EnterWarningLettersModel,
} = require("../../../../../models/EnterWarningPackage");
const compressing = require("compressing");
const {
  enterWarningLetterToBilling,
} = require("../../../../../api/cleancity/dxsh/enterWarningLetterToBilling");

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

          const elements = [];
          sheet.forEach((row, i) => {
            console.log(row);
            if (!row.D || !row.B || !row.A || !row.C) {
              return ctx.reply(
                `${i + 2}-qatorda muammo borligi sabab olib tashlandi`
              );
            }
            elements.push({
              order_num: row.A,
              lischet: row.B,
              qarzdorlik: row.C,
              date: {
                kun: row.D.split("-")[0],
                oy: row.D.split("-")[1],
                yil: row.D.split("-")[2],
              },
              comment: row.E,
            });
          });
          const newPachka = await EnterWarningLettersModel.create({ elements });
          ctx.wizard.state.pachka_id = newPachka._id;
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
  async (ctx) => {
    return ctx.wizard.next();
    try {
      if (!ctx.message) return;
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
        if (err) console.log(err);
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

          const pachka = await EnterWarningLettersModel.findById(
            ctx.wizard.state.pachka_id
          );
          const newItems = pachka.elements;
          const saqlanadigan_papka = "./uploads/" + pachka._id;
          fs.mkdir(saqlanadigan_papka, async (err) => {
            console.error(new Error("Papka ochishda xatolik"), err);

            const notFound = [];
            async function checkArxiv() {
              files.forEach(async (item) => {
                const lischet = item.split(".")[0];
                const foundItem = pachka.elements.find(
                  (item) => item.lischet == lischet
                );
                console.log(Boolean(foundItem));

                if (!foundItem) {
                  return notFound.push(item);
                }
                await fs.promises.copyFile(
                  `${dirname}/${item}`,
                  `${saqlanadigan_papka}/${item}`
                );
                const indexToUpdate = newItems.findIndex(
                  (item) => item.lischet == lischet
                );
                if (!newItems[indexToUpdate].xujjat) {
                  if (indexToUpdate !== -1) {
                    newItems[indexToUpdate].xujjat = true;
                  }
                }
              });
            }

            await checkArxiv();
            await pachka.updateOne({ $set: { elements: newItems } });

            if (notFound.length > 0) {
              await ctx.reply(
                `Arxivdan ayrim begona fayllar aniqlandi. Ular ${JSON.stringify(
                  notFound
                )}`
              );
            }

            let haliKiritilmagan = ``;
            for (let i = 0; i < newItems.length; i++) {
              const item = newItems[i];
              if (!item.xujjat) {
                haliKiritilmagan += item.lischet + "\n";
              }
            }
            if (haliKiritilmagan != ``) {
              return await ctx.replyWithHTML(
                `Quyidagi abonentlarning ogohlantirish xati hali kiritilmadi. Iltimos kiriting: <code>${haliKiritilmagan}</code>`
              );
            }

            await ctx.reply(
              `Hamma ma'lumot tayyor ruxsat bersangiz bazaga kiritishni boshlayman 🙂 \n Bazaga kiritaymi?`,
              createInlineKeyboard([
                [
                  ["Xa 👌", "yes"],
                  ["Yo'q 🙅‍♂️", "no"],
                ],
              ])
            );
            ctx.wizard.next();
          });
        });
      });
    } catch (error) {
      throw new Error(error);
    }
  },
  async (ctx) => {
    try {
      if (ctx.message) {
        return await ctx.reply(
          `Hamma ma'lumot tayyor ruxsat bersangiz bazaga kiritishni boshlayman 🙂 \n Bazaga kiritaymi?`,
          createInlineKeyboard([
            [
              ["Xa 👌", "yes"],
              ["Yo'q 🙅‍♂️", "no"],
            ],
          ])
        );
      }

      if (ctx.callbackQuery.data == "no") {
        await ctx.reply("OK", keyboards.lotin.adminKeyboard.resize());
        ctx.scene.leave();
        return;
      }
      const pachka = await EnterWarningLettersModel.findById(
        ctx.wizard.state.pachka_id
      );

      let counter = 0;
      const errors = [];
      async function uploadToBilling() {
        if (counter == pachka.elements.length) return;
        const item = pachka.elements[counter];
        const res = await enterWarningLetterToBilling({
          lischet: item.lischet,
          qarzdorlik: item.qarzdorlik,
          comment: item.comment,
          sana: `${item.date.kun}.${item.date.oy}.${item.date.yil}`,
          file_path: `./uploads/ogohlantirishlar/${item.lischet}.PDF`,
        });

        console.log(res);
        counter++;
        if (res.success) {
          ctx.replyWithHTML(
            `<code>${item.lischet}</code> ogohlantirish xati kiritildi`
          );
        } else {
          errors.push(res);
        }
        await uploadToBilling();
        return;
      }
      await uploadToBilling();
      console.log(errors);
    } catch (err) {
      console.error(err, new Error("Xatolik kuzatildi"));
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
