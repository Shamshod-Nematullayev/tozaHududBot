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
const PDFMerger = require("pdf-merger-js");
const { sendToSud } = require("../../../api/sendToSud");
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
          if (!keyingiXujjatTuri)
            await ctx.reply(
              `${xujjatTuri} to'liq qabul qilindi. Endi ${keyingiXujjatTuri} larini kiriting`
            );
          else {
            pachka.items.forEach(async (item) => {
              const abonent = await Abonent.findOne({ licshet: item.KOD });
              const mfy = await Mahalla.findOne({ id: abonent.mahallas_id });
              if (!mfy.ommaviy_shartnoma) {
                return ctx.reply(`${mfy.name} ommaviy shartnomasi bazada yo'q`);
              }
              const ommaviy_shartnoma_file_name = `${ctx.wizard.state.baseDirectory}/ommaviy_shartnomalar/${mfy.id}.PDF`;
              const mfyStream = fs.createWriteStream(
                ommaviy_shartnoma_file_name
              );
              const fileOnTG = await bot.telegram.getFileLink(
                mfy.ommaviy_shartnoma.file_id
              );
              https.get(fileOnTG.href, (res) => {
                res.pipe(mfyStream);
                mfyStream.on("finish", (cb) => {
                  console.log(mfy.name + " ommaviy shartnomasi yuklab olindi");
                });
              });
            });
            // await downloadFileToBaseDir(
            //   ctx.wizard.state.baseDirectory,
            //   "GUVOHNOMA.PDF",
            //   guvohnomaFileID
            // );
            // await downloadFileToBaseDir(
            //   ctx.wizard.state.baseDirectory,
            //   "SHARTNOMA.PDF",
            //   shartnomaSSPFileID
            // );
            // await downloadFileToBaseDir(
            //   ctx.wizard.state.baseDirectory,
            //   "ISHONCHNOMA.PDF",
            //   ishonchnomaFileID
            // );
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
      const directories = [
        "/arizalar",
        "/abonent_kartalar",
        "/ommaviy_shartnomalar",
        "/ogohlantirish_xatlari",
      ];

      // Function to create directories
      function createDirectories(baseDirectory, directories) {
        fs.mkdir(baseDirectory, (err) => {
          if (err) {
            console.error(
              `Error creating to basedir ${baseDirectory}${directory}:`,
              err
            );
          } else {
            console.log(`Directory ${baseDirectory} created successfully.`);
          }
        });
        directories.forEach((directory) => {
          fs.mkdir(baseDirectory + directory, (err) => {
            if (err) {
              console.error(
                `Error creating ${baseDirectory}${directory}:`,
                err
              );
            } else {
              console.log(
                `Directory ${baseDirectory}${directory} created successfully.`
              );
            }
          });
        });
      }
      createDirectories(baseDirectory, directories);

      await ctx.replyWithDocument(sudMaterialImportExcel, {
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
            await ctx.telegram.deleteMessage(
              ctx.chat.id,
              waiterMessage.message_id
            );
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
  // async (ctx) => {
  //   arxivdanFaylOlish(
  //     ctx,
  //     "arizalar",
  //     "ARIZA_FILE_ID",
  //     "SSP ARIZA",
  //     "OGOHLANTIRISH XATI"
  //   );
  // },
  // async (ctx) => {
  //   arxivdanFaylOlish(
  //     ctx,
  //     "ogohlantirish_xatlari",
  //     "OGOHLANTIRISH_XATI_FILE_ID",
  //     "OGOHLANTIRISH XATI",
  //     "ABONENT KARTA"
  //   );
  // },
  // async (ctx) => {
  //   arxivdanFaylOlish(
  //     ctx,
  //     "abonent_kartalar",
  //     "ABONENT_KARTA_FILE_ID",
  //     "ABONENT KARTA"
  //   );
  // },
  async (ctx) => {
    if (ctx.callbackQuery) {
      switch (ctx.callbackQuery.data) {
        case "xa":
          // Sudga yuborish aktlari
          fs.mkdir(ctx.wizard.state.baseDirectory + "/shakl2", async (err) => {
            if (err) console.log(err);

            const pachka = await SudMaterial.findById(
              ctx.wizard.state.pachka_id
            );
            let count = 0;
            // pachka.items.forEach(async (item) => {
            async function downloadOmmaviy() {
              if (count == pachka.items.length) return;

              const item = pachka.items[count];
              const abonent = await Abonent.findOne({ licshet: item.KOD });
              const mfy = await Mahalla.findOne({ id: abonent.mahallas_id });
              if (!mfy.ommaviy_shartnoma) {
                return ctx.reply(`${mfy.name} ommaviy shartnomasi bazada yo'q`);
              }
              const ommaviy_shartnoma_file_name = `${ctx.wizard.state.baseDirectory}/ommaviy_shartnomalar/${mfy.id}.PDF`;
              const mfyStream = fs.createWriteStream(
                ommaviy_shartnoma_file_name
              );
              const fileOnTG = await bot.telegram.getFileLink(
                mfy.ommaviy_shartnoma.file_id
              );
              https.get(fileOnTG.href, (res) => {
                res.pipe(mfyStream);
                mfyStream.on("finish", async (cb) => {
                  console.log(mfy.name + " ommaviy shartnomasi yuklab olindi");
                  count++;
                  await downloadOmmaviy();
                });
              });
            }
            // await downloadOmmaviy();
            // });
            const newItems = pachka.items;
            // for (let item of pachka.items) {
            let counter = 0;
            const errors = [];
            function sudgaKiritish() {
              if (counter == pachka.items.length) {
                if (errors.length > 0) {
                  let errMessage = ``;
                  errors.forEach((error) => {
                    errMessage += error;
                  });
                  ctx.reply(errMessage);
                }
                return;
              }
              let item = pachka.items[counter];
              fs.mkdir(
                ctx.wizard.state.baseDirectory + "/shakl2/" + item.KOD,
                async (err) => {
                  if (err && err.code != "EEXIST") throw err;
                  await fs.promises.copyFile(
                    `${ctx.wizard.state.baseDirectory}/arizalar/${item.KOD}.PDF`,
                    `${
                      ctx.wizard.state.baseDirectory + "/shakl2/" + item.KOD
                    }/ariza.PDF`
                  );
                  const abonent = await Abonent.findOne({
                    licshet: String(item.KOD),
                  });
                  let merger = new PDFMerger();
                  let isError = false;
                  const convert = async () => {
                    try {
                      await merger.add(
                        `${ctx.wizard.state.baseDirectory}/ommaviy_shartnomalar/${abonent.mahallas_id}.PDF`
                      );
                      await merger.add(
                        `${ctx.wizard.state.baseDirectory}/ogohlantirish_xatlari/${item.KOD}.PDF`
                      );
                      await merger.add(
                        `${ctx.wizard.state.baseDirectory}/abonent_kartalar/${item.KOD}.PDF`
                      );

                      // Set metadata
                      await merger.setMetadata({
                        producer: "oliy ong",
                        author: "Shamshod Nematullayev",
                        creator: "Toza Hudud bot",
                        title: "Sudga yuborish ilovalar",
                      });

                      await merger.save(
                        `${
                          ctx.wizard.state.baseDirectory + "/shakl2/" + item.KOD
                        }/ilovalar.PDF`
                      );
                    } catch (error) {
                      isError = true;
                      console.error(error);
                    } //save under given name and reset the internal document
                  };
                  await convert();
                  if (isError) {
                    counter++;
                    sudgaKiritish();
                    return;
                  }
                  if (!abonent.shaxsi_tasdiqlandi.confirm) {
                    throw `${item.KOD} shaxsi tasdiqlanmagan`;
                  }
                  const indexToUpdate = newItems.findIndex(
                    (a) => a.KOD == item.KOD
                  );
                  if (!item.sud_case_id || item.sud_case_id == null) {
                    console.log(item, counter);
                    const response = await sendToSud({
                      doc_date: item.ARIZA_DATE,
                      qarz: item.QARZ,
                      pinfl: abonent.pinfl,
                      doc_number: item.ARIZA_NUM,
                      pochta_harajati: item.POCHTA_HARAJATI,
                      ariza_dir: `${
                        ctx.wizard.state.baseDirectory + "/shakl2/" + item.KOD
                      }/ariza.PDF`,
                      ilovalar_dir: `${
                        ctx.wizard.state.baseDirectory + "/shakl2/" + item.KOD
                      }/ilovalar.PDF`,
                    });
                    if (response.failed) {
                      errors.push(response.message);
                    }
                    if (indexToUpdate !== -1) {
                      newItems[indexToUpdate].sud_case_id = response.case_id;
                      newItems[indexToUpdate].FISH = response.FISH;
                    }
                    await pachka.updateOne({ $set: { items: newItems } });
                    ctx.reply(`<code>${item.KOD}</code> kiritildi`, {
                      parse_mode: "HTML",
                    });
                    counter++;
                    sudgaKiritish();
                    return;
                  }
                  counter++;
                  sudgaKiritish();
                }
              );
            }
            sudgaKiritish();
          });

          break;
        case "yoq":
          await SudMaterial.findByIdAndDelete(ctx.wizard.state.pachka_id);
          rimraf(ctx.wizard.state.baseDirectory, []);
          ctx.reply("Bekor qilindi");
          ctx.scene.leave();
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
