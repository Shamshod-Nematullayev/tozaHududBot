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
const xlsx = require("json-as-xlsx");
const path = require("path");

const pochtaHarajatiniTekshirishScene = new Scenes.WizardScene(
  "pochtaHarajatiniTekshirishScene",
  async (ctx) => {
    try {
      if (ctx.message.text) return ctx.scene.leave();
      if (ctx.session.messageToDelete) {
        await ctx.deleteMessage(ctx.session.messageToDelete);
        ctx.session.messageToDelete = undefined;
      }
      const excelFileLink = await ctx.telegram.getFileLink(
        ctx.message.document.file_id
      );
      const filename = "./uploads/pochtaharajat" + Date.now();
      const writeStream = fs.createWriteStream(filename);
      https.get(excelFileLink.href, (res) => {
        res.pipe(writeStream);
        writeStream.on("finish", async () => {
          let counter = 0;
          const xls = excelToJson({ sourceFile: filename });
          const sheet = xls[Object.keys(xls)[0]];
          const results = [];
          const checkInvoise = async () => {
<<<<<<< HEAD
            console.log(sheet[counter].B);
            if (counter !== sheet.length && counter > 0) {
=======
            if (counter !== sheet.length && counter > 0) {
              console.log(sheet[counter].B);
>>>>>>> 088521e41d6c2213c08eddc44555ca5ea7b657a4
              const response = await pochtaHarajatiniTekshirish(
                sheet[counter].B
              );
              results.push({
                orderNum: counter,
                pochta_harajati_id: sheet[counter].B,
                amount: response.amount / 100,
                balance: response.balance / 100,
                invoiceStatus: response.invoiceStatus,
              });
              counter++;
              await checkInvoise();
            } else if (counter === sheet.length) {
              fs.unlinkSync(filename);
              const newfileName = path.join(
                __dirname,
                "../../../uploads/excelFile" + Date.now()
              );
              let settings = {
                fileName: newfileName, // Name of the resulting spreadsheet
                extraLength: 3, // A bigger number means that columns will be wider
                writeMode: "writeFile", // The available parameters are 'WriteFile' and 'write'. This setting is optional. Useful in such cases https://docs.sheetjs.com/docs/solutions/output#example-remote-file
                writeOptions: {}, // Style options from https://docs.sheetjs.com/docs/api/write-options
                // RTL: true, // Display the columns from right-to-left (the default value is false)
              };
              const data = [
                {
                  Sheet: "Results",
                  columns: [
                    { label: "№", value: "orderNum" },
                    { label: "ID", value: "pochta_harajati_id" },
                    { label: "Summa", value: "amount" },
                    { label: "Balans", value: "balance" },
                    { label: "Holati", value: "invoiceStatus" },
                  ],
                  content: results,
                },
              ];
              console.log(newfileName);
              await xlsx(data, settings);
              console.log(filename);
              await ctx.replyWithDocument(
                { source: newfileName + ".xlsx" },
                { caption: "Hammasi tayyor" }
              );
              //   fs.unlinkSync(newfileName);
              ctx.scene.leave();
            } else {
              counter++;
              await checkInvoise();
            }
          };
          await checkInvoise();
        });
      });
    } catch (error) {
      ctx.reply("Xatolik kuzatildi");
      console.log(error);
      console.error(new Error("Xatolik kuzatildi"));
    }
  }
);

pochtaHarajatiniTekshirishScene.enter(async (ctx) => {
  try {
    ctx
      .replyWithDocument(pochtaHarajatlariTekshirishInputExcelShablon, {
        caption: `Men tekshirishim kerak bo'lgan pochta harajatlari kvitansiyalarini excel jadvalga joylashtirib yuboring`,
      })
      .then((res) => {
        ctx.session.messageToDelete = res.message_id;
      });
  } catch (error) {
    console.log(error);
    console.error(new Error("Xatolik kuzatildi"));
  }
});

module.exports = { pochtaHarajatiniTekshirishScene };
