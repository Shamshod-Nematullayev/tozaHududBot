// requires
const { Markup } = require("telegraf");
const { Mahalla } = require("../models/Mahalla");
const { NewAbonent } = require("../models/NewAbonents");
const {
  Composer,
  bot,
  messages,
  keyboards,
  Nazoratchi,
} = require("../requires");

const composer = new Composer();
composer.hears(["👤Yangi abonent ochish", "👤Янги абонент"], (ctx) => {
  ctx.scene.enter("new_abonent_request");
});
composer.hears(["🔎Izlash", "🔎Излаш"], (ctx) => {
  ctx.scene.enter("SEARCH_BY_NAME");
});
// composer.hears(["🔌ЭЛЕКТР КОДИ🔌", "🔌ELEKTR KODI🔌"], async (ctx) => {
//   ctx.scene.enter("updateElektrKod");
// });

composer.hears(
  ["👥Mening abonentlarim", "👥Менинг абонентларим"],
  async (ctx) => {
    try {
      const nazoratchi = await Nazoratchi.findOne({ telegram_id: ctx.from.id });
      if (!nazoratchi) {
        return ctx.reply(`Siz bunday huquqga ega emassiz`);
      }

      const mahallalar = await Mahalla.find({
        "biriktirilganNazoratchi.inspactor_id": nazoratchi.id,
      });
      if (mahallalar.length == 0) {
        return ctx.reply("Sizga biriktirilgan mahallalar yo'q!");
      }
      const keys = mahallalar.map((mfy) => {
        return [Markup.button.callback(mfy.name, "newAbonentsList_" + mfy.id)];
      });
      ctx.reply("Sizga biriktirilgan mahallalar", Markup.inlineKeyboard(keys));
    } catch (err) {
      console.error(err);
      ctx.reply("Xatolik");
    }
  }
);
composer.action(/newAbonentsList_/, async (ctx) => {
  try {
    ctx.deleteMessage();
    const abonents = await NewAbonent.find({
      mahalla_id: ctx.callbackQuery.data.split("_")[1],
    });
    let str = "";
    if (abonents.length == 0) {
      return ctx.reply("Abonentlar yo'q!");
    }
    abonents.forEach((abonent) => {
      str += `<b>${abonent.licshet}</b> = ${abonent.abonent_name}\n`;
    });
    ctx.replyWithHTML(str);
  } catch (err) {
    console.error(err);
    ctx.reply("Xatolik");
  }
});
// async (ctx) => {
//   const abonents = await Abonent.find({ ["user.id"]: ctx.from.id });
//   let str = "";
//   if (abonents.length > 0) {
//     let counter = 0;
//     if (abonents.length > 50) {
//       abonents.forEach((elem, i) => {
//         str += `${i + 1}. ${qaysiMahalla(elem.data.MFY_ID)}  ${
//           elem.isCancel
//             ? "*" + elem.data.FISH + "*"
//             : "*" + elem.data.FISH + "*"
//         }: \`${elem.kod}\`\n`;
//         if (i % 50 == 0) {
//           ctx.reply(str, { parse_mode: "Markdown" });
//           counter++;
//           str = "";
//         }
//       });
//       if ((counter - 1) % 50 !== 0) {
//         ctx.reply(str, { parse_mode: "Markdown" });
//       }
//     } else {
//       abonents.forEach((elem, i) => {
//         const mahallaName = qaysiMahalla(elem.data.MFY_ID);
//         const fishName = elem.isCancel
//           ? `*${elem.data.FISH}*`
//           : `*${elem.data.FISH}*`;
//         const kodValue = `\`${elem.kod}\``;
//         str += `${i + 1}. ${mahallaName} ${fishName}: ${kodValue}\n`;
//       });
//       ctx.replyWithMarkdownV2(str);
//     }
//   } else {
//     ctx.reply(messages.noAbonent);
//   }
// }

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

// Entering to scene by inline buttons
const actions = [
  "GUVOHNOMA_KIRITISH",
  "multiply_livings",
  "update_abonent_date_by_pinfil",
  "connect_phone_number",
  "changeAbonentStreet",
];

actions.forEach((action) => {
  composer.action(action, (ctx) => {
    ctx.scene.enter(action);
    ctx.deleteMessage();
  });
});

bot.use(composer);
