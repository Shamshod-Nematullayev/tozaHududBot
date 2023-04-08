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
composer.hears("👤Yangi abonent ochish", (ctx) => {
  ctx.scene.enter("NEW_ABONENT");
});
composer.hears("🔎Izlash", (ctx) => {
  ctx.reply(messages.izlashUsuliTanlash, keyboards.searchType);
});
composer.action("searchByID", (ctx) => {
  ctx.scene.enter("searchByID");
});
composer.action("searchByFISH", (ctx) => {
  ctx.reply("Bu funksiya hali to'liq ishlab chiqilmadi");
});

composer.hears("👥Mening abonentlarim", async (ctx) => {
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
});

composer.hears("📓Qo`llanma", (ctx) => {
  ctx.reply("Hozircha video qo'llanma mavjud emas. 🧠 Ishlatish kifoya");
});
composer.hears("✏️Ma'lumotlarini o'zgartirish", (ctx) => {
  ctx.reply(messages.chooseEditType, keyboards.editTypes.oneTime());
});

// Ma'lumotlarni o'zgartirish funcsiyalariga yo'llash
// composer.action("o'lim guvohnomasi", (ctx) => {
//   ctx.scene.enter("GUVOHNOMA_KIRITISH");
// });

bot.use(composer);
