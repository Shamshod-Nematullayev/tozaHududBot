const { Scenes } = require("telegraf");
const { Admin } = require("../../models/Admin");

const newAdminScene = new Scenes.WizardScene(
  "newAdmin",
  (ctx) => {
    try {
      if (ctx.message && isCancel(ctx.message.text)) return ctx.scene.leave();
      ctx.wizard.state.login = ctx.message.text;
      ctx.reply(messages.enterYourPassword);
      ctx.wizard.next();
    } catch (error) {
      console.log(error);
    }
  },
  async (ctx) => {
    if (ctx.message && isCancel(ctx.message.text)) return ctx.scene.leave();
    ctx.wizard.state.password = ctx.message.text;
    const admin = ctx.wizard.state;
    await new Admin({
      user_id: ctx.from.id,
      login: admin.login,
      password: admin.password,
    }).save();
    ctx.scene.leave();
  }
);

newAdminScene.enter((ctx) => {
  ctx.reply(
    messages.enterYourLogin,
    keyboards[ctx.session.til].cancelBtn.resize()
  );
});

newAdminScene.leave((ctx) => {
  ctx.reply(
    messages.adminDone,
    keyboards[ctx.session.til].mainKeyboard.resize()
  );
});

module.exports = newAdminScene;
