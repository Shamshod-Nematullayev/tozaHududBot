const { isCancel } = require("../../smallFunctions/isCancel");
const { Scenes } = require("telegraf");
const { keyboards } = require("../../../lib/keyboards");
const { SudMaterial } = require("../../../models/SudMaterial");
const fs = require("fs");
const path = require("path");

const getSudMaterial = new Scenes.WizardScene(
  "get_sud_material",
  async (ctx) => {
    try {
      // pachka yaratish
      const pachka = await SudMaterial.create({ name: ctx.message.text });
      ctx.wizard.state.pachka_id = pachka._id;
      // yuklanishlar papkasida ushbu pachka uchun yangi papka yaratish
      fs.mkdir("./uploads/" + pachka._id);
      ctx.replyWithDocument(_, {
        caption: `Sudga yuborish uchun xujjatlari tayyor abonentlar ro'yxatini na'munadagi jadvalga joylashtirib tashlab bering`,
      });
    } catch (error) {
      console.error(error);
    }
  }
);

getSudMaterial.on("text", (ctx, next) => {
  if (isCancel(ctx.message.text)) {
    ctx.reply("Bekor qilindi");
    return ctx.scene.leave();
  } else next();
});
getSudMaterial.enter("Pachka uchun nom kiriting", keyboards);
