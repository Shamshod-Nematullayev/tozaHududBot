// requires
const { Composer, bot, messages, keyboards } = require("../requires");

const composer = new Composer();
composer.hears(["👤Yangi abonent ochish", "👤Янги абонент"], (ctx) => {
  ctx.scene.enter("new_abonent_request");
});
composer.hears(["🔎Izlash", "🔎Излаш"], (ctx) => {
  ctx.reply(messages.izlashUsuliTanlash, keyboards[ctx.session.til].searchType);
});
composer.action("searchByID", (ctx) => {
  ctx.scene.enter("searchByID");
});

// const mahallalar = require("../lib/mahallalar.json");
// function qaysiMahalla(id) {
//   let res = "";
//   mahallalar.forEach((mfy) => {
//     if (mfy.id == id) res = mfy.name;
//   });
//   return res;
// }
// composer.hears(
//   ["👥Mening abonentlarim", "👥Менинг абонентларим"],
//   async (ctx) => {
//     const abonents = await Abonent.find({ ["user.id"]: ctx.from.id });
//     let str = "";
//     if (abonents.length > 0) {
//       let counter = 0;
//       if (abonents.length > 50) {
//         abonents.forEach((elem, i) => {
//           str += `${i + 1}. ${qaysiMahalla(elem.data.MFY_ID)}  ${
//             elem.isCancel
//               ? "*" + elem.data.FISH + "*"
//               : "*" + elem.data.FISH + "*"
//           }: \`${elem.kod}\`\n`;
//           if (i % 50 == 0) {
//             ctx.reply(str, { parse_mode: "Markdown" });
//             counter++;
//             str = "";
//           }
//         });
//         if ((counter - 1) % 50 !== 0) {
//           ctx.reply(str, { parse_mode: "Markdown" });
//         }
//       } else {
//         abonents.forEach((elem, i) => {
//           const mahallaName = qaysiMahalla(elem.data.MFY_ID);
//           const fishName = elem.isCancel
//             ? `*${elem.data.FISH}*`
//             : `*${elem.data.FISH}*`;
//           const kodValue = `\`${elem.kod}\``;
//           str += `${i + 1}. ${mahallaName} ${fishName}: ${kodValue}\n`;
//         });
//         ctx.replyWithMarkdownV2(str);
//       }
//     } else {
//       ctx.reply(messages.noAbonent);
//     }
//   }
// );

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
  "SEARCH_BY_NAME",
  "multiply_livings",
  "update_abonent_date_by_pinfil",
  "connect_phone_number",
];

actions.forEach((action) => {
  composer.action(action, (ctx) => {
    ctx.scene.enter(action);
    ctx.deleteMessage();
  });
});

bot.use(composer);
