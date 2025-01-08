const { Scenes } = require("telegraf");
const { Admin } = require("../../../requires");
const bcrypt = require("bcrypt");

const changePasswordScene = new Scenes.WizardScene(
  "changePasswordScene",
  async (ctx) => {
    try {
      const admin = await Admin.findOne({ user_id: ctx.chat.id });
      if (!admin) {
        ctx.reply("Sizning adminlik huquqingiz yoq");
        return ctx.scene.leave();
      }
      ctx.wizard.state.admin = admin;
      if (admin.password) {
        ctx.reply("Joriy parolni kiriting");
        return ctx.wizard.next();
      }
      ctx.reply("Yangi parolni kiriting");
      return ctx.wizard.selectStep(2);
    } catch (error) {
      ctx.reply("Xatolik kuzatildi");
      console.error(error);
      ctx.scene.leave();
    }
  },
  async (ctx) => {
    try {
      const admin = ctx.wizard.state.admin;
      const validPassword = await bcrypt.compare(
        ctx.message.text,
        admin.password
      );
      if (!validPassword) {
        ctx.reply("Parol noto'g'ri kiritildi");
        return ctx.scene.leave();
      }
      ctx.reply("Yangi parolni kiriting");
      return ctx.wizard.next();
    } catch (error) {
      ctx.reply("Xatolik kuzatildi");
      console.error(error);
      ctx.scene.leave();
    }
  },
  async (ctx) => {
    const admin = ctx.wizard.state.admin;
    try {
      await Admin.findByIdAndUpdate(ctx.wizard.state.admin._id, {
        $set: {
          password: await bcrypt.hash(ctx.message.text, 10),
        },
      });
      ctx.reply(
        `Parol muvaffaqqiyatli o'zgartirildi\n Login: <code>${admin.login}</code>`
      );
      ctx.scene.leave();
    } catch (error) {
      ctx.reply("Xatolik kuzatildi");
      console.error(error);
      ctx.scene.leave();
    }
  }
);

module.exports = changePasswordScene;
