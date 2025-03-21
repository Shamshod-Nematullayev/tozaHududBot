const { WizardScene } = require("telegraf/scenes");
const { Abonent } = require("../../../models/Abonent");
const { htmlPDF } = require("../../../requires");
const { tozaMakonApi } = require("../../../api/tozaMakon");
const { HybridMail } = require("../../../models/HybridMail");
const PDFMerger = require("pdf-merger-js");
const ejs = require("ejs");
const path = require("path");
const { default: axios } = require("axios");
const FormData = require("form-data");

const uploadWarningTozamakonScene = new WizardScene(
  "uploadWarningTozamakonScene",
  async (ctx) => {
    await ctx.reply("pochta cheklar reytsterini PDF formatida yuboring");
    ctx.wizard.next();
  },
  async (ctx) => {
    try {
      const filePath = await ctx.telegram.getFileLink(
        ctx.message.document.file_id
      );
      const response = await axios.get(filePath, {
        responseType: "arraybuffer",
      });
      const pdfBuffer = response.data;
      ctx.wizard.state.pdfBuffer = pdfBuffer;
      ctx.reply(
        "Ushbu pdfdagi abonent hisob raqamlarini yuboring. Misol: 105120500123\n105120500124\n105120500129"
      );
      ctx.wizard.next();
    } catch (error) {
      console.error(error);
      await ctx.reply("Xatolik kuzatildi");
      ctx.scene.leave();
    }
  },
  async (ctx) => {
    try {
      const accountNumbers = ctx.message.text.split(/\s+/);
      await ctx.reply("Amaliyot boshlandi");
      for (const accountNumber of accountNumbers) {
        const abonent = await Abonent.findOne({ licshet: accountNumber });
        if (!abonent) {
          await ctx.reply(
            `Hisob raqamiga ${accountNumber} abonent mavjud emas.`
          );
          continue;
        }
        const now = new Date();
        const oltiOyAvval = new Date(now.getFullYear(), now.getMonth(), 1);
        const mail = await HybridMail.findOne({
          licshet: abonent.licshet,
          warning_date_billing: {
            $gte: oltiOyAvval,
            $lt: now,
          },
        });
        if (mail) {
          ctx.reply(
            `${abonent.licshet} hisob raqamiga allaqachon xabar yuborilgan`
          );
          continue;
        }
        const abonentData = (
          await tozaMakonApi.get("/user-service/residents/" + abonent.id)
        ).data;
        const { buffer, courtWarning } = await createWarningLetterPDF(
          abonentData
        );
        const newMailOnDB = await HybridMail.create({
          licshet: abonent.licshet,
          type: "ogohlantirish_by_pochta",
          createdOn: new Date(),
          receiver: abonentData.fullName,
          warning_date_billing: new Date(),
          warning_amount: abonentData.balance.kSaldo,
          sud_process_id_billing: courtWarning.id,
        });

        let merger = new PDFMerger();
        await merger.add(buffer);
        await merger.add(ctx.wizard.state.pdfBuffer);
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
          abonent.licshet + `.pdf`
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
          "/user-service/court-processes/" + courtWarning.id + "/add-file",
          {
            description: `warning letter by hybrid`,
            fileName: `${fileUploadBilling.fileName}*${fileUploadBilling.fileId}`,
            fileType: "WARNING_FILE",
          }
        );
        await HybridMail.findByIdAndUpdate(newMailOnDB._id, {
          $set: {
            isSavedBilling: true,
            sud_process_id_billing: courtWarning.id,
          },
        });
        await ctx.reply(`${abonent.licshet} bajarildi`);
      }
      await ctx.reply("Amaliyot muvaffaqqiyatli yakunlandi");
      ctx.scene.leave();
    } catch (error) {
      console.error(error);
      await ctx.reply("Xatolik kuzatildi");
      ctx.scene.leave();
    }
  }
);

module.exports = { uploadWarningTozamakonScene };

async function createWarningLetterPDF(abonentData) {
  const courtWarning = (
    await tozaMakonApi.get("/user-service/court-warnings", {
      params: {
        status: "NEW",
        page: 0,
        size: 10,
        accountNumber: abonentData.accountNumber,
      },
    })
  ).data.content[0];
  const warningDataPrint = (
    await tozaMakonApi.get(
      "/user-service/court-warnings/" + courtWarning.id + "/print"
    )
  ).data;

  const createHtmlString = new Promise((resolve, reject) => {
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
  const html = await createHtmlString;
  const convertPDF = new Promise((resolve, reject) => {
    htmlPDF
      .create(html, { format: "letter", orientation: "portrait" })
      .toBuffer((err, str) => {
        if (err) return reject(err);

        resolve({ buffer: str, courtWarning });
      });
  });
  return await convertPDF;
}
