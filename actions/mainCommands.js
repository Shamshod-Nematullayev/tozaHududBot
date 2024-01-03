const { Composer, Scenes, Markup } = require("telegraf");
const { bot } = require("../core/bot");
const { Abonent } = require("../models/YangiAbonent");
const composer = new Composer();
const mahallalar = require("../lib/mahallalar.json");
const { messages } = require("../lib/messages");
const abonents = require("../lib/abonents.json");
const { keyboards } = require("../lib/keyboards");

function qaysiMahalla(id) {
  let res = "";
  mahallalar.forEach((mfy) => {
    if (mfy.id == id) res = mfy.name;
  });
  return res;
}
composer.hears(["👤Yangi abonent ochish", "👤Янги абонент"], (ctx) => {
  ctx.scene.enter("NEW_ABONENT");
});
composer.hears(["🔎Izlash", "🔎Излаш"], (ctx) => {
  ctx.reply(messages.izlashUsuliTanlash, keyboards[ctx.session.til].searchType);
});
composer.action("searchByID", (ctx) => {
  ctx.scene.enter("searchByID");
});
// composer.action("searchByFISH", (ctx) => {
//   ctx.reply("Bu funksiya hali to'liq ishlab chiqilmadi");
// });

composer.hears(
  ["👥Mening abonentlarim", "👥Менинг абонентларим"],
  async (ctx) => {
    const abonents = await Abonent.find({ ["user.id"]: ctx.from.id });
    let str = "";
    if (abonents.length > 0) {
      let counter = 0;
      if (abonents.length > 50) {
        abonents.forEach((elem, i) => {
          str += `${i + 1}. ${qaysiMahalla(elem.data.MFY_ID)}  ${
            elem.isCancel
              ? "<strike>" + elem.data.FISH + "</strike>"
              : "<b>" + elem.data.FISH + "</b>"
          }: <code>${elem.kod}</code>\n`;
          if (i % 50 == 0) {
            ctx.reply(str, { parse_mode: "HTML" });
            counter++;
            str = "";
          }
        });
        if ((counter - 1) % 50 !== 0) {
          ctx.reply(str, { parse_mode: "HTML" });
        }
      } else {
        abonents.forEach((elem, i) => {
          str += `${i + 1}. ${qaysiMahalla(elem.data.MFY_ID)}  ${
            elem.isCancel
              ? "<strike>" + elem.data.FISH + "</strike>"
              : "<b>" + elem.data.FISH + "</b>"
          }: <code>${elem.kod}</code>\n`;
        });
        ctx.reply(str, { parse_mode: "HTML" });
      }
    } else {
      ctx.reply(messages.noAbonent);
    }
  }
);

composer.hears(["📓Qo`llanma", "📓Қўлланма"], (ctx) => {
  ctx.reply("Hozircha video qo'llanma mavjud emas. 🧠 Ishlatish kifoya");
});
composer.hears(["✏️Ma'lumotlarini o'zgartirish", "✏️Тахрирлаш"], (ctx) => {
  ctx.reply(
    messages.chooseEditType,
    keyboards[ctx.session.til].editTypes.oneTime()
  );
});

composer.hears(["⚙Sozlamalar", "⚙Созламалар"], (ctx) => {
  ctx.reply(messages.chooseMenu, keyboards[ctx.session.til].settings);
});
// Ma'lumotlarni o'zgartirish funcsiyalariga yo'llash
composer.action("o'lim guvohnomasi", (ctx) => {
  ctx.scene.enter("GUVOHNOMA_KIRITISH");
});

// Fuqoro rasmini tashlash
composer.action("fuqoro_rasmi", (ctx) => {
  ctx.deleteMessage();
  ctx.scene.enter("fuqoro_rasmini_kiritish");
});
composer.action("searchByFISH", (ctx) => {
  ctx.deleteMessage();
  ctx.scene.enter("SEARCH_BY_NAME");
});
composer.action("multply livings", (ctx) => {
  ctx.deleteMessage();
  ctx.scene.enter("multiply_livings");
});
composer.action("update_abonent_date_by_pinfil", (ctx) => {
  ctx.deleteMessage();
  ctx.scene.enter("update_abonent_date_by_pinfil");
});

composer.action("connect_phone_number", (ctx) =>
  ctx.scene.enter("connect_phone_number")
);

bot.catch((err, ctx) => {
  ctx.telegram.sendMessage(1382670100, "Xatolik");
  console.log({ err });
});
bot.use(composer);
