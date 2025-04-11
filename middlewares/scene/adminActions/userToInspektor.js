const { Scenes, Markup } = require("telegraf");
const { createInlineKeyboard, keyboards } = require("../../../lib/keyboards");
const { Nazoratchi } = require("../../../models/Nazoratchi");
const { User } = require("../../../models/User");
const isCancel = require("../../smallFunctions/isCancel");
const { Admin } = require("../../../requires");

const userToInspektor = new Scenes.WizardScene(
  "user_to_inspektor",
  async (ctx) => {
    try {
      const admin = await Admin.findOne({ user_id: ctx.from.id });
      ctx.wizard.state.admin = admin;
      const user = await User.findOne({ "user.id": Number(ctx.message.text) });
      if (!user) {
        return ctx.reply(
          "Bunday id raqamiga ega foydalanuvchi topilmadi",
          keyboards.cancelBtn.resize()
        );
      }
      if (user.nazoratchiQilingan) {
        return ctx.reply(
          "Ushbu foydalanuvchi ID raqami allaqachon nazoratchiga biriktirilgan"
        );
      }
      ctx.wizard.state.telegram_id = ctx.message.text;
      ctx.replyWithHTML(
        `<a href="https://t.me/${user.user.username}">${user.user.first_name}</a>`
      );

      const inspectors = await Nazoratchi.find({
        companyId: admin.companyId,
      });
      const buttonsArray = [];
      inspectors.forEach((ins) => {
        buttonsArray.push([Markup.button.callback(ins.name, ins.id)]);
      });
      await ctx.reply(
        "Hisobni qaysi nazoratchiga biriktiramiz?",
        Markup.inlineKeyboard(buttonsArray).oneTime()
      );
      ctx.wizard.next();
    } catch (error) {
      console.log("user_to_inspektor scene 1");
      throw error;
    }
  },
  async (ctx) => {
    try {
      await ctx.deleteMessage();

      const a = await User.findOneAndUpdate(
        { "user.id": Number(ctx.wizard.state.telegram_id) },
        { $set: { nazoratchiQilingan: true } }
      );
      console.log(a);
      await Nazoratchi.findOneAndUpdate(
        { id: ctx.update.callback_query?.data },
        { $push: { telegram_id: parseInt(ctx.wizard.state.telegram_id) } }
      );
      await ctx.reply(
        "Muvaffaqqiyatli biriktirildi. Yana biriktiramizmi?",
        createInlineKeyboard([[["Xa", "xa"]], [["Yo'q", "yoq"]]])
      );
      ctx.wizard.next();
    } catch (error) {
      console.log("user_to_inspektor scene 2");
      throw error;
    }
  },
  async (ctx) => {
    try {
      if (ctx.callbackQuery?.data) ctx.deleteMessage();
      switch (ctx.callbackQuery?.data) {
        case "xa":
          ctx.reply("Foydalanuvchi telegram ID raqamini kiriting!");
          ctx.wizard.selectStep(0);
          break;
        case "yoq":
          await ctx.deleteMessage();
          ctx.reply("OK", keyboards.adminKeyboard.resize());
          ctx.scene.leave();
          break;
      }
      ctx.reply("OK", keyboards.adminKeyboard.resize());
      ctx.scene.leave();
    } catch (error) {
      console.log("user_to_inspektor scene 3");
      throw error;
    }
  }
);

userToInspektor.on("text", async (ctx, next) => {
  if (ctx.message.text) {
    if (isCancel(ctx.message?.text)) {
      await ctx.reply("Bekor qilindi", keyboards.adminKeyboard.resize());
      return ctx.scene.leave();
    }
  }
  next();
});

userToInspektor.enter((ctx) => {
  ctx.reply("Foydalanuvchi telegram ID raqamini kiriting!");
});

module.exports = { userToInspektor };
