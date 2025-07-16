import { Scenes } from "telegraf";

import { messages } from "@lib/messages.js";
import { keyboards } from "@lib/keyboards.js";
import { Admin } from "@models/Admin.js";

import bcrypt from "bcrypt";

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
    ctx.wizard.state.password = await bcrypt.hash(ctx.message.text, 10);
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
  ctx.reply(messages.enterYourLogin, keyboards.cancelBtn.resize());
});

newAdminScene.leave((ctx) => {
  ctx.reply(messages.adminDone, keyboards.mainKeyboard.resize());
});

export default newAdminScene;
