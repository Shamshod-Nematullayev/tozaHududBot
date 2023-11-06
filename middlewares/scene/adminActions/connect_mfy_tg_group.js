const { Scenes, Markup } = require("telegraf");
const { keyboards } = require("../../../lib/keyboards");
const { v4: uui4 } = require("uuid");
const { Mahalla } = require("../../../models/Mahalla");
const isCancel = require("../../smallFunctions/isCancel");

const connect_mfy_tg_group_scene = new Scenes.WizardScene(
  "connect_mfy_tg_group",
  async (ctx) => {
    try {
      if (isCancel(ctx.message?.text)) {
        process.env.ADD_TG_GROUP_TOKEN = "";
        await ctx.reply(
          `Guruhni ulash bekor qilindi`,
          keyboards.lotin.adminKeyboard.resize()
        );
        return ctx.scene.leave();
      }
      if (ctx.callbackQuery?.data.split("_")[0] == "mahalla") {
        process.env.ADD_TG_GROUP_TOKEN = uui4();
        process.env.ADMIN_ID = ctx.from.id;
        process.env.CURRENT_MFY_ID = ctx.callbackQuery.data.split("_")[1];
        ctx.editMessageText(
          `Telegram guruhga quyidagi tokenni yozib yuboring. !!!DIQQAT!!! o'sha guruhga telegram bot superadmin qilingan bo'lishi shart.\n\nTOKEN: <code>${process.env.ADD_TG_GROUP_TOKEN}</code>`,
          {
            parse_mode: "HTML",
          }
        );
        ctx.reply(
          "Token kutilmoqda...",
          keyboards.lotin.cancelBtn.oneTime().resize()
        );
      } else {
        throw new Error(
          `Noto'g'ri update keldi. Mahallalardan biri tanlanishi kutilgan edi`
        );
      }
    } catch (err) {
      ctx.reply("mahalla gruppasini ulash sahnasida xatolik step_1");
      console.log(err);
    }
  }
);

connect_mfy_tg_group_scene.enter(async (ctx) => {
  const mahallalar = await Mahalla.find();
  let arr = [];
  function compare(a, b) {
    if (a.name < b.name) {
      return -1;
    }
    if (a.name > b.name) {
      return 1;
    }
    return 0;
  }

  mahallalar.sort(compare);
  mahallalar.forEach((mfy, i) => {
    arr.push([Markup.button.callback(mfy.name, "mahalla_" + mfy.id)]);
  });
  ctx.reply(
    `Telegram guruhini botga ulamoqchi bo'lgan mahallani tanlang`,
    Markup.inlineKeyboard(arr)
  );
});

module.exports = { connect_mfy_tg_group_scene };
