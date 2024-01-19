const isCancel = require("../../smallFunctions/isCancel");
const { Scenes } = require("telegraf");
const { keyboards, createInlineKeyboard } = require("../../../lib/keyboards");
const { SudMaterial } = require("../../../models/SudMaterial");
const fs = require("fs");
const {
  sudMaterialImportExcel,
  guvohnomaFileID,
  shartnomaSSPFileID,
  ishonchnomaFileID,
} = require("../../../constants");
const excelToJson = require("convert-excel-to-json");
const { messages } = require("../../../lib/messages");
const https = require("https");
const compressing = require("compressing");
const { bot } = require("../../../core/bot");
const rimraf = require("rimraf");
const path = require("path");
const { Abonent } = require("../../../models/Abonent");
const { Mahalla } = require("../../../models/Mahalla");
async function downloadFileToBaseDir(baseDirectory, filename, file_id) {
  const fileTelegramPath = await bot.telegram.getFileLink(file_id);
  const fileStream = fs.createWriteStream(baseDirectory + "/" + filename);
  https.get(fileTelegramPath.href, (res) => {
    res.pipe(fileStream);
  });
  fileStream.on("finish", (cb) => {
    console.log(`${filename} yuklab olindi`);
    return true;
  });
}

async function arxivdanFaylOlish(
  ctx,
  saqlanadigan_papka,
  saqlanadigan_ozgaruvchi,
  xujjatTuri,
  keyingiXujjatTuri
) {
  try {
    if (
      !ctx.message.document ||
      ctx.message.document.mime_type !== "application/zip"
    ) {
      return ctx.reply("Siz ZIP arxiv kiritmadingiz");
    } else {
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
          const pachka = await SudMaterial.findById(ctx.wizard.state.pachka_id);
          const notFound = [];
          const newItems = pachka.items;
          async function updateDocuments() {
            for (const file of files) {
              const KOD = file.split(".")[0];
              const foundItem = pachka.items.find((item) => item.KOD == KOD);

              if (!foundItem) {
                notFound.push(file);
              } else {
                try {
                  await fs.promises.copyFile(
                    `${dirname}/${file}`,
                    `${ctx.wizard.state.baseDirectory}/${saqlanadigan_papka}/${file}`
                  );

                  // Update the MongoDB document
                  const indexToUpdate = newItems.findIndex(
                    (item) => item.KOD == KOD
                  );
                  if (!newItems[indexToUpdate][saqlanadigan_ozgaruvchi]) {
                    const fileOnTG = await bot.telegram.sendDocument(
                      process.env.TEST_BASE_CHANNEL_ID,
                      {
                        source: `${ctx.wizard.state.baseDirectory}/${saqlanadigan_papka}/${file}`,
                      }
                    );
                    if (indexToUpdate !== -1) {
                      newItems[indexToUpdate][saqlanadigan_ozgaruvchi] =
                        fileOnTG.document.file_id;
                    }
                  }
                } catch (err) {
                  console.error(`${file} - Error:`, err);
                }
              }
            }
          }

          await updateDocuments();
          await pachka.updateOne({ $set: { items: newItems } });
          //   begona fayllar haqida habar berish
          if (notFound.length > 0) {
            await ctx.reply(
              `Arxivdan ayrim begona fayllar aniqlandi. Ular ${JSON.stringify(
                notFound
              )}`
            );
          }
          fs.unlink(filename, (err) => {
            if (err) throw err;
          });
          rimraf(path.join(dirname), []);
          //   topilmagan fayllarni qayta so'rash
          let haliKiritilmagan = ``;
          for (let i = 0; i < newItems.length; i++) {
            const item = newItems[i];
            if (!item[saqlanadigan_ozgaruvchi]) {
              haliKiritilmagan += item.KOD + "\n";
            }
          }
          if (haliKiritilmagan != ``) {
            return await ctx.replyWithHTML(
              `Quyidagi abonentlarning ${xujjatTuri} hali kiritilmadi. Iltimos kiriting: <code>${haliKiritilmagan}</code>`
            );
          }
          // hammasi to'g'ri bajarilganida
          if (keyingiXujjatTuri)
            await ctx.reply(
              `${xujjatTuri} to'liq qabul qilindi. Endi ${keyingiXujjatTuri} larini kiriting`
            );
          else {
            pachka.items.forEach(async (item) => {
              const abonent = await Abonent.findOne({ licshet: item.KOD });
              const mfy = await Mahalla.findOne({ id: abonent.mahallas_id });
              const ommaviy_shartnoma_file_name = `${ctx.wizard.state.baseDirectory}/ommaviy_shartnomalar/${mfy.id}.PDF`;
              const mfyStream = fs.createWriteStream(
                ommaviy_shartnoma_file_name
              );
              const fileOnTG = await bot.telegram.getFileLink(
                mfy.ommaviy_shartnoma.file_id
              );
              https.get(fileOnTG.href, (res) => {
                res.pipe(mfyStream);
              });
              mfyStream.on("finish", (cb) => {
                console.log(mfy.name + " ommaviy shartnomasi yuklab olindi");
              });
            });
            await downloadFileToBaseDir(
              ctx.wizard.state.baseDirectory,
              "GUVOHNOMA.PDF",
              guvohnomaFileID
            );
            await downloadFileToBaseDir(
              ctx.wizard.state.baseDirectory,
              "SHARTNOMA.PDF",
              shartnomaSSPFileID
            );
            await downloadFileToBaseDir(
              ctx.wizard.state.baseDirectory,
              "ISHONCHNOMA.PDF",
              ishonchnomaFileID
            );
            await ctx.reply(
              "Hamma ma'lumotlar tayyor, sudga yuboraymi?",
              createInlineKeyboard([[["Xa", "xa"]], [["Keyinroq", "keyinroq"]]])
            );
          }
          ctx.wizard.next();
          // kiritilgan fil zip formatidami? va o'zi umuman faylmi? isDocument
        });
      });
    }
  } catch (error) {
    console.error(error);
    ctx.reply("xatolik kuzatildi", keyboards.lotin.cancelBtn.resize());
  }
}

const getSudMaterial = new Scenes.WizardScene(
  "get_sud_material",
  async (ctx) => {
    try {
      // pachka yaratish
      const pachka = await SudMaterial.create({ name: ctx.message.text });
      ctx.wizard.state.pachka_id = pachka._id;
      // yuklanishlar papkasida ushbu pachka uchun yangi papka yaratish
      // Create a base directory
      const baseDirectory = "./uploads/" + pachka._id;
      ctx.wizard.state.baseDirectory = baseDirectory;

      // Create subdirectories
      fs.mkdir(baseDirectory, (err) => {
        if (err) throw err;
      });

      fs.mkdir(baseDirectory + "/arizalar", (err) => {
        if (err) throw err;
      });

      fs.mkdir(baseDirectory + "/abonent_kartalar", (err) => {
        if (err) throw err;
      });

      fs.mkdir(baseDirectory + "/ommaviy_shartnomalar", (err) => {
        if (err) throw err;
      });

      fs.mkdir(baseDirectory + "/forma_birlar", (err) => {
        if (err) throw err;
      });
      fs.mkdir(baseDirectory + "/ogohlantirish_xatlari", (err) => {
        if (err) throw err;
      });
      ctx.replyWithDocument(sudMaterialImportExcel, {
        caption: `Sudga yuborish uchun xujjatlari tayyor abonentlar ro'yxatini na'munadagi jadvalga joylashtirib tashlab bering`,
      });
      ctx.wizard.next();
    } catch (error) {
      console.error(error);
      ctx.reply("Xatolik kuzatildi");
    }
  },
  async (ctx) => {
    try {
      if (
        ctx.message.document &&
        (ctx.message.document.mime_type ==
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
          ctx.message.document.mime_type == "application/vnd.ms-excel")
      ) {
        const waiterMessage = await ctx.reply(messages.pleaseWait);
        const xlsx = await ctx.telegram.getFileLink(
          ctx.message.document.file_id
        );
        const filename = `./sudmaterial${Date.now()}.xlsx`;
        const excelFile = fs.createWriteStream(filename);
        https.get(xlsx.href, (res) => {
          res.pipe(excelFile);
          excelFile.on("finish", async (cb) => {
            const xls = excelToJson({
              sourceFile: filename,
            });

            const sheet = xls[Object.keys(xls)[0]];
            const rows = [];
            for (let i = 0; i < sheet.length - 1; i++) {
              rows.push({
                KOD: sheet[i + 1].A,
                QARZ: sheet[i + 1].B,
                ARIZA_NUM: sheet[i + 1].C,
                ARIZA_DATE: sheet[i + 1].D,
                POCHTA_HARAJATI: sheet[i + 1].E,
              });
            }
            await SudMaterial.findByIdAndUpdate(ctx.wizard.state.pachka_id, {
              $set: { items: rows },
            });
            ctx.reply(
              "Endi arizalarni scaner qilingan variantini zip arxivlangan holda menga yuboring. Fayllarni ajratib olishim uchun fayl nomini abonent lischet kodi bilan nomlang!"
            );
            fs.unlink(filename, (err) => {
              if (err) throw err;
            });
            ctx.wizard.next();
          });
        });
      } else {
        return ctx.reply(
          "Siz excel fayl kiritmadingiz",
          keyboards.lotin.cancelBtn
        );
      }
    } catch (error) {
      console.error(error);
      ctx.reply("xatolik kuzatildi", keyboards.lotin.cancelBtn.resize());
    }
  },
  async (ctx) => {
    arxivdanFaylOlish(
      ctx,
      "arizalar",
      "ARIZA_FILE_ID",
      "SSP ARIZA",
      "OGOHLANTIRISH XATI"
    );
  },
  async (ctx) => {
    arxivdanFaylOlish(
      ctx,
      "ogohlantirish_xatlari",
      "OGOHLANTIRISH_XATI_FILE_ID",
      "OGOHLANTIRISH XATI",
      "ABONENT KARTA"
    );
  },
  async (ctx) => {
    arxivdanFaylOlish(
      ctx,
      "abonent_kartalar",
      "ABONENT_KARTA_FILE_ID",
      "ABONENT KARTA",
      "FORMA 1"
    );
  },
  async (ctx) => {
    arxivdanFaylOlish(ctx, "forma_birlar", "FORMA_BIR_FILE_ID", "FORMA 1");
  },
  async (ctx) => {
    if (ctx.callbackQuery) {
      switch (ctx.callbackQuery.data) {
        case "xa":
          // Sudga yuborish aktlari
          break;
        case "yoq":
          await SudMaterial.findByIdAndDelete(ctx.wizard.state.pachka_id);
          rimraf(ctx.wizard.state.baseDirectory, []);
          ctx.reply("Bekor qilindi");
          break;
      }
    } else {
      ctx.reply(
        "Hamma ma'lumotlar tayyor, sudga yuboraymi?",
        createInlineKeyboard([[["Xa", "xa"]], [["yo'q", "yoq"]]])
      );
    }
  }
);

getSudMaterial.on("text", (ctx, next) => {
  if (isCancel(ctx.message.text)) {
    ctx.reply("Bekor qilindi");
    return ctx.scene.leave();
  } else next();
});
getSudMaterial.enter((ctx) =>
  ctx.reply("Pachka uchun nom kiriting", keyboards)
);

module.exports = { getSudMaterial };
