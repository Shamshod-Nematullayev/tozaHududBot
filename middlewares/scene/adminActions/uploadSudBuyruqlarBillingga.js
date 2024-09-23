const { Scenes } = require("telegraf");
const { SudAkt } = require("../../../models/SudAkt");
const { keyboards } = require("../../../requires");
const {
  handleTelegramExcel,
} = require("../../smallFunctions/handleTelegramExcel");
const isCancel = require("../../smallFunctions/isCancel");
const fs = require("fs");
const {
  sudXujjatlariBiriktirish,
} = require("../../../api/cleancity/dxsh/sudXujjatlariBiriktirish");

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
          if (sudAkt.sudQaroriBillinggaYuklandi)
            return reject({
              succes: true,
              message: "Allaqachon yuklangan: " + sudAkt.licshet,
            });
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
          console.log(await case_details.text());
          const case_details = await case_details_res.json();
          const case_documents = case_details.case_case_documents;
          const decisionDocs = case_documents.filter(
            (doc) =>
              doc.case_document.category &&
              doc.case_document.category.includes("DECISION")
          );

          if (decisionDocs.length === 0) {
            // If no "DECISION" documents are found, find documents with category "EXECUTION"
            decisionDocs = case_documents.filter(
              (doc) => doc.case_document.category === "EXECUTION"
            );
          }

          if (decisionDocs.length > 0) {
            const promises = decisionDocs.map((doc) => {
              return new Promise(async (resolve, reject) => {
                let file_type = "";
                if (doc.case_document.docx == null) file_type = "pdf";
                else file_type = "docx";
                let document_data = await fetch(
                  "https://cabinetapi.sud.uz/api/cabinet/case/download_as_buffer/" +
                    doc.case_document[file_type].id,
                  {
                    headers: {
                      accept: "application/json, text/plain, */*",
                      "accept-language":
                        "en-GB,en-US;q=0.9,en;q=0.8,uz;q=0.7,ru;q=0.6",
                      "content-type": "application/json",
                      responsetype: "arraybuffer",
                      "sec-ch-ua":
                        '"Not)A;Brand";v="99", "Google Chrome";v="127", "Chromium";v="127"',
                      "sec-ch-ua-mobile": "?0",
                      "sec-ch-ua-platform": '"Windows"',
                      "sec-fetch-dest": "empty",
                      "sec-fetch-mode": "cors",
                      "sec-fetch-site": "same-site",
                      "x-auth-token": "4db69fe9-107b-449b-bcea-2f9a989909d8",
                    },
                    referrer: "https://cabinet.sud.uz/",
                    referrerPolicy: "strict-origin-when-cross-origin",
                    body: null,
                    method: "GET",
                    mode: "cors",
                    credentials: "omit",
                  }
                );
                document_data = await document_data.json();
                const pdfBuffer = Buffer.from(document_data.data, "base64");
                const filename = "./uploads/" + Date.now() + "." + file_type;
                fs.writeFile(filename, pdfBuffer, async (err) => {
                  if (err) {
                    console.error("Error writing file:", err);
                  } else {
                    console.log(
                      `Successfully saved ${document_data.name} to./uploads/`
                    );
                    const yuklashNatijasi = await sudXujjatlariBiriktirish({
                      process_id: sudAkt.sud_process_id_billing,
                      file_path: filename,
                    });
                    if (yuklashNatijasi.success) resolve(yuklashNatijasi);
                    else reject(yuklashNatijasi);
                  }
                });
              });
            });
            await Promise.all(promises);
            // const statusAlmashtirish =
            //   await sudQaroruChiqorildiStatusigaUtkazish(
            //     sudAkt.sud_process_id_billing
            //   );
            // console.log({ statusAlmashtirish });
            // if (statusAlmashtirish.success) {
            ctx.reply(sudAkt.licshet + " billingga yuklandi");
            resolve({
              success: true,
              message: sudAkt.licshet + " billingga yuklandi",
            });
            // }
          } else {
            reject({
              success: false,
              message: "Sud buyrug'i yoki ijro varaqalari topilmadi",
            });
          }
        });
      });
      await Promise.all(promises);
      ctx.scene.leave();
      ctx.reply(
        "Sud buyruqlar billingga yuklandi",
        keyboards.lotin.adminKeyboard.resize()
      );
    } catch (err) {
      console.error({ err });
      ctx.reply("Xatolik kuzatildi. " + err.message);
    }
  }
);

uploadSudBuyruqlarBillingga.on("text", (ctx, next) => {
  if (isCancel(ctx.message.text)) {
    ctx.reply("Bekor qilindi", keyboards.lotin.adminKeyboard.resize());
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
