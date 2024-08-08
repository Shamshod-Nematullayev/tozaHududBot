const { Scenes } = require("telegraf");
const { SudAkt } = require("../../../models/SudAkt");
const {
  handleTelegramExcel,
} = require("../../smallFunctions/handleTelegramExcel");
const isCancel = require("../../smallFunctions/isCancel");

const uploadSudBuyruqlarBillingga = new Scenes.WizardScene(
  "upload_execution_to_billing",
  async (ctx) => {
    try {
      const headers = {
        accept: "application/json, text/plain, */*",
        "accept-language": "en-GB,en-US;q=0.9,en;q=0.8,uz;q=0.7,ru;q=0.6",
        "content-type": "application/json",
        responsetype: "arraybuffer",
        "sec-ch-ua":
          '"Not)A;Brand";v="99", "Google Chrome";v="127", "Chromium";v="127"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-site",
        "x-auth-token": "f1b4f1c2-2575-4772-b75b-7baf0d56bc79",
      };
      const data = await handleTelegramExcel(ctx);
      const promises = data.map(({ cleancity_sud_process_id }) => {
        return new Promise(async (resolve, reject) => {
          const sudAkt = await SudAkt.findOne({
            sud_process_id_billing: cleancity_sud_process_id,
          });
          if (!sudAkt) {
            return reject({
              succes: false,
              message: "Sud akt DataBaseda topilmadi",
            });
          }
          const case_details_res = await fetch(
            "https://cabinetapi.sud.uz/api/cabinet/case/conflict-suit-view/" +
              sudAkt.sud_case_id,
            {
              headers: headers,
              referrer: "https://cabinet.sud.uz/",
              referrerPolicy: "strict-origin-when-cross-origin",
              body: null,
              method: "GET",
              mode: "cors",
            }
          );
          const case_details = await case_details_res.json();
          const case_documents = case_details.case_case_documents;
          console.log(case_documents);
        });
      });
      await Promise.all(promises);
    } catch (err) {
      console.error(err);
      ctx.reply("Xatolik kuzatildi. " + err.message);
    }
  }
);

uploadSudBuyruqlarBillingga.on("text", (ctx, next) => {
  if (isCancel(ctx.message.text)) {
    ctx.scene.leave();
    return;
  } else {
    return next();
  }
});

uploadSudBuyruqlarBillingga.enter((ctx) => {
  ctx.replyWithDocument(
    { source: "./lib/input_sud_proccess_id.xlsx" },
    {
      caption:
        "Tizimga yuklanishi kerak bo'lgan abonentlar billing sud proccess id raqamlarini mazkur excel faylga joylashtirib bizga qayta yuboring",
    }
  );
});

module.exports = { uploadSudBuyruqlarBillingga };
