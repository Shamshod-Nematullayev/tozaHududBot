const { Composer, Scenes } = require("telegraf");
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
  ctx.reply(
    messages[ctx.session.til].izlashUsuliTanlash,
    keyboards[ctx.session.til].searchType
  );
});
composer.action("searchByID", (ctx) => {
  ctx.scene.enter("searchByID");
});
composer.action("searchByFISH", (ctx) => {
  ctx.reply("Bu funksiya hali to'liq ishlab chiqilmadi");
});

composer.hears(
  ["👥Mening abonentlarim", "👥Менинг абонентларим"],
  async (ctx) => {
    const abonents = await Abonent.find({ ["user.id"]: ctx.from.id });
    let str = "";
    if (abonents.length > 0) {
      abonents.forEach((elem, i) => {
        str += `${i + 1}. ${qaysiMahalla(elem.data.MFY_ID)}  ${
          elem.isCancel
            ? "<strike>" + elem.data.FISH + "</strike>"
            : "<b>" + elem.data.FISH + "</b>"
        }: <code>${elem.kod}</code>\n`;
      });
      ctx.reply(str, { parse_mode: "HTML" });
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
    messages[ctx.session.til].chooseEditType,
    keyboards[ctx.session.til].editTypes.oneTime()
  );
});

composer.hears(["⚙Sozlamalar", "⚙Созламалар"], (ctx) => {
  ctx.reply(
    messages[ctx.session.til].chooseMenu,
    keyboards[ctx.session.til].settings
  );
});
// Ma'lumotlarni o'zgartirish funcsiyalariga yo'llash
// composer.action("o'lim guvohnomasi", (ctx) => {
//   ctx.scene.enter("GUVOHNOMA_KIRITISH");
// });

bot.use(composer);
