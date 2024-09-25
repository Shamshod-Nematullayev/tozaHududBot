const { Scenes, Markup } = require("telegraf");
const { createInlineKeyboard, keyboards } = require("../../../lib/keyboards");
const { Nazoratchi } = require("../../../models/Nazoratchi");
const { User } = require("../../../models/User");
const isCancel = require("../../smallFunctions/isCancel");

const userToInspektor = new Scenes.WizardScene(
  "user_to_inspektor",
  async (ctx) => {
    try {
      if (isCancel(ctx.message?.text)) {
        await ctx.reply("Bekor qilindi");
        return ctx.scene.leave();
      }

      const user = await User.findOne({ "user.id": Number(ctx.message.text) });
      if (!user) {
        return ctx.reply(
          "Bunday id raqamiga ega foydalanuvchi topilmadi",
          keyboards.lotin.cancelBtn.resize()
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

      const inspectors = await Nazoratchi.find();
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
      if (ctx.message?.text) {
        await ctx.reply(
          "Bekor qilindi",
          keyboards.lotin.adminKeyboard.resize()
        );
        return ctx.scene.leave();
      }
      ctx.deleteMessage();

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
  (ctx) => {
    try {
      if (ctx.message?.text) {
        ctx.reply("OK", keyboards.lotin.adminKeyboard.resize());
        ctx.scene.leave();
      }
      if (ctx.callbackQuery?.data) ctx.deleteMessage();
      switch (ctx.callbackQuery?.data) {
        case "xa":
          ctx.reply("Foydalanuvchi telegram ID raqamini kiriting!");
          ctx.wizard.selectStep(0);
          break;
        case "yoq":
          ctx.deleteMessage();
          ctx.reply("OK", keyboards.lotin.adminKeyboard.resize());
          ctx.scene.leave();
          break;
      }
    } catch (error) {
      console.log("user_to_inspektor scene 3");
      throw error;
    }
  }
);

userToInspektor.enter((ctx) => {
  ctx.reply("Foydalanuvchi telegram ID raqamini kiriting!");
});

module.exports = { userToInspektor };
