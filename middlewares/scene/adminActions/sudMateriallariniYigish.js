const { Scenes } = require("telegraf");

const sudMateriallariniYigish = new Scenes.WizardScene(
  "sud_materiallarini_yigish",
  async (ctx) => {}
);

sudMateriallariniYigish.middleware((ctx, next) => {});

sudMateriallariniYigish.enter((ctx) => {
  ctx.reply("Yangi pachka uchun nom kiriting");
});
