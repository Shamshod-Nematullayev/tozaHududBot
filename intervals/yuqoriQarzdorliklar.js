const nodeHtmlToImage = require("node-html-to-image");
const { Abonent } = require("../models/Abonent");
const { Mahalla } = require("../models/Mahalla");
const ejs = require("ejs");
const path = require("path");
const fs = require("fs");
const { bot } = require("../core/bot");

// Har kuni bir marotaba mahallaning telegram guruhiga tashlanadigan qarzdorlar ro'yxati uchun interval
setInterval(async () => {
  const date = new Date(Date.now());
  // if ichiga jadval tashlanadigan vaqtning shartlari kiritiladi
  if (date.getHours() === 12 && date.getMinutes() == 0) {
    const mahallalar = await Mahalla.find({
      groups: { $exists: true, $ne: [] },
    });
    mahallalar.forEach(async (mfy) => {
      const billingAbonents = await Abonent.find({
        saldo_k: { $gt: 200000 },
        mahallas_id: mfy.id,
      });
      billingAbonents.sort((a, b) => {
        return b.saldo_k - a.saldo_k;
      });
      const data = billingAbonents.slice(0, 50);
      const filename = `./yuqoriqarz${Date.now()}.png`;
      let html = "";
      ejs.renderFile(
        path.join(__dirname, "../", "views", "qarzdorAbonentlar.ejs"),
        { data },
        {},
        (err, str) => {
          html = str;
        }
      );
      nodeHtmlToImage({
        html,
        selector: "table",
        output: filename,
        type: "png",
      }).finally(() => {
        const sendToGroups = new Promise((resolve, reject) => {
          mfy.groups.forEach(async (group, indexGroup) => {
            try {
              await bot.telegram.sendPhoto(
                group.id,
                { source: filename },
                {
                  caption: `${mfy.name}даги қарздорлиги юқори бўлган абонентлар. Агар ушбу рўйхатда бўлсангиз қарздорлик унлируви МИБ га ўтиш хавфи борлигидан огохлантирамиз!!!`,
                }
              );
            } catch (error) {
              bot.telegram.sendMessage(
                5347896070,
                `Qarzdorlik ro'yxatini mahalla guruhiga yuborishda xatolik kuzatildi.`
              );
              console.error(error);
            }
            if (indexGroup === mfy.groups.length - 1) resolve();
          });
        });
        sendToGroups.then(() => {
          fs.unlink(filename, (err) => {
            if (err) {
              bot.telegram.sendMessage(
                5347896070,
                `Qarzdorlik ro'yxatini o'chirib yuborishda xatolik.`
              );
              bot.telegram.sendMessage(5347896070, JSON.stringify(err));
            }
          });
        });
      });
    });
  }
}, 1000 * 60);
