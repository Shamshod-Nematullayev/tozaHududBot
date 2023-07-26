const nodeHtmlToImage = require("node-html-to-image");
const { Composer } = require("telegraf");
const { bot } = require("../core/bot");
const { keyboards } = require("../lib/keyboards");
const { messages } = require("../lib/messages");
const { Admin } = require("../models/Admin");
const fs = require("fs");
const { drawAndSendTushum } = require("../middlewares/drawTushum");
const {
  fetchEcopayTushum,
  fetchEcoTranzaksiyalar,
} = require("../middlewares/fetchEcopay");

const composer = new Composer();
async function isAdmin(ctx) {
  const admins = await Admin.find();
  let confirm = false;
  admins.forEach((admin) => {
    if (admin.user_id == ctx.from.id) {
      confirm = true;
    }
  });
  return confirm;
}
composer.command("admin", async (ctx) => {
  const admins = await Admin.find();
  if (admins.length === 0) ctx.scene.enter("newAdmin");
});

composer.hears(["👨‍💻 Ish maydoni", "👨‍💻 Иш майдони"], async (ctx) => {
  const confirm = isAdmin(ctx);
  if (!confirm) {
    ctx.reply(messages[ctx.session.til].youAreNotAdmin);
  } else {
    ctx.reply(
      messages[ctx.session.til].chooseMenu,
      keyboards[ctx.session.til].adminWorkSpace
    );
  }
});

composer.hears(["Тушумни ташлаш", "Tushumni tashlash"], (ctx) => {
  const confirm = isAdmin(ctx);
  if (!confirm) {
    ctx.reply(messages.lotin.youAreNotAdmin);
  } else {
    ctx.scene.enter("import_income_report");
  }
});
// process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0";

// fetch(
//   "https://cleancity.uz/ds?xenc=wpcoI7nL81kbBIfPZwFLTwQWvIFvJxDiJ5f8sxqIGmBIt6EwWJN3yt_POa278nZ5WbLQUiu_X6echF--BPQegovNvM0-8kqwbV8aZ9VWylH5Zrj95X1QwA==",
//   {
//     headers: {
//       accept: "application/json, text/javascript, */*; q=0.01",
//       "accept-language":
//         "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7,uz;q=0.6,uk;q=0.5",
//       "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
//       "sec-ch-ua":
//         '"Not.A/Brand";v="8", "Chromium";v="114", "Google Chrome";v="114"',
//       "sec-ch-ua-mobile": "?0",
//       "sec-ch-ua-platform": '"Windows"',
//       "sec-fetch-dest": "empty",
//       "sec-fetch-mode": "cors",
//       "sec-fetch-site": "same-origin",
//       "x-requested-with": "XMLHttpRequest",
//       Cookie: "JSESSIONID=F26749585769E3DD00670D6A2DDE0245.thweb8",
//     },
//     referrer:
//       "https://cleancity.uz/dashboard?x=w*6PWIq0qtB6r2O0EuHhY-23c-BGRNA7ehhbz8OUSsdNYxeomFWSU91eyt3rrMXgur4sp5W6SVqcbJ*4r3aHKS2hKYi*EAq3",
//     referrerPolicy: "strict-origin-when-cross-origin",
//     body: "mes=7&god=2023&companies_id=1144&sort=id&order=asc",
//     method: "POST",
//     mode: "cors",
//     credentials: "include",
//   }
// ).then(async (res) => {
//   const data = await res.json();
// });
composer.command("tushum", async (ctx) => {
  const data = await fetchEcopayTushum();
  console.log("Tushum tashlandi hukumdorim");
  fetchEcoTranzaksiyalar();
  drawAndSendTushum(data, ctx);
});

composer.action("add_notification_letter", (ctx) => {
  const confirm = isAdmin(ctx);
  ctx.deleteMessage();
  if (!confirm) {
    ctx.reply(messages.lotin.youAreNotAdmin);
  } else {
    ctx.scene.enter("add_notification");
  }
});

composer.action("generate_alert", (ctx) => {
  ctx.scene.enter("generate_alert_letter");
});

composer.action("show_abonent_pic", (ctx) => {
  ctx.scene.enter("show_abonent_pic");
});

composer.action("game_over_play", (ctx) =>
  ctx.scene.enter("confirm_game_over")
);

composer.action("set_plan_for_inspectors", (ctx) => {
  ctx.reply();
});
// composer.on("text", (ctx) => {
//   if (ctx.from.id == 1382670100) ctx.replyWithDocument(ctx.message.text);
// });

bot.use(composer);
