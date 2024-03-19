const excelToJson = require("convert-excel-to-json");
const { Scenes } = require("telegraf");
const {
  pochtaHarajatlariTekshirishInputExcelShablon,
} = require("../../../constants");
const https = require("https");
const fs = require("fs");
const {
  pochtaHarajatiniTekshirish,
} = require("../../../api/pochtaHarajatiniTekshirish");

const pochtaHarajatiniTekshirishScene = new Scenes.WizardScene(
  "pochtaHarajatiniTekshirishScene",
  async (ctx) => {
    try {
      const excelFileLink = await ctx.telegram.getFileLink(
        ctx.message.document.file_id
      );
      const filename = "./uploads/pochtaharajat" + Date.now();
      const writeStream = fs.createWriteStream(filename);
      https.get(excelFileLink.href, (res) => {
        res.pipe(writeStream);
        writeStream.on("finish", async () => {
          let counter = 0;
          const xlsx = excelToJson({ sourceFile: filename });
          const sheet = xlsx[Object.keys(xlsx)[0]];
          const results = [];
          const checkInvoise = async () => {
            console.log(sheet);
            if (counter !== sheet.length && counter > 0) {
              const response = await pochtaHarajatiniTekshirish(
                sheet[counter].B
              );
              results.push({ response });
              counter++;
              await checkInvoise();
            } else if (counter === sheet.length) {
              console.log(results);
            }
          };
          await checkInvoise();
        });
      });
    } catch (error) {
      console.log(error);
      console.error(new Error("Xatolik kuzatildi"));
    }
  }
);

pochtaHarajatiniTekshirishScene.enter(async (ctx) => {
  try {
    ctx.replyWithDocument(pochtaHarajatlariTekshirishInputExcelShablon, {
      caption: `Men tekshirishim kerak bo'lgan pochta harajatlari kvitansiyalarini excel jadvalga joylashtirib yuboring`,
    });
  } catch (error) {
    console.log(error);
    console.error(new Error("Xatolik kuzatildi"));
  }
});

module.exports = { pochtaHarajatiniTekshirishScene };
