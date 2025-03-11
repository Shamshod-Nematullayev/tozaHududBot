const { Scenes } = require("telegraf");
const getAbonents = require("../../../api/cleancity/dxsh/getAbonents");
const { createInlineKeyboard, keyboards } = require("../../../lib/keyboards");
const { Abonent } = require("../../../models/Abonent");
const { Mahalla } = require("../../../models/Mahalla");

const importAbonentsScene = new Scenes.WizardScene(
  "import_abonents_data",
  async (ctx) => {
    if (ctx.message?.text == `👨‍💻 Ish maydoni`) return ctx.scene.leave();
    if (ctx.update.callback_query.data == "no") {
      ctx.reply("Bekor qilindi", keyboards.adminKeyboard.resize());
      return ctx.scene.leave();
    } else if (ctx.update.callback_query.data == "yes") {
      const date = new Date();
      const mahallalar = await Mahalla.find({ reja: { $gt: 0 } });
      ctx.reply("Qabul qilindi, iltimos kutib turing");
      let indexMFY = 0;
      async function fech() {
        if (indexMFY === mahallalar.length) {
          ctx.scene.leave();
          ctx.reply("Barchasi yangilab bo'lindi");
        }
        const mfy = mahallalar[indexMFY];
        const data = await getAbonents({ mfy_id: mfy.id });
        if (!data || data.length < 1) {
          await ctx.reply("Nimadur xatolik yuz berdi");
          ctx.scene.leave();
        } else {
          await ctx.reply("Baza yangilanyapti...");
          for (let i = 0; i < data.length; i++) {
            const row = data[i];

            const abonent = await Abonent.findOne({ licshet: row.licshet });
            if (abonent) {
            } else {
              await Abonent.create({
                ...row,
              });
            }
          }
          await ctx
            .reply(
              `${mfy.name} yangilandi. ${indexMFY + 1} of ${mahallalar.length}`
            )
            .finally(() => {
              indexMFY++;
              if (mahallalar.length !== indexMFY) fech();
              return;
            });
        }
      }
      fech();
    }
  }
);

importAbonentsScene.enter((ctx) => {
  ctx.reply(
    `Abonentlar ma'lumotlarini cleancity ma'lumotlar bazasidan yangilash jarayonini boshlamoqdaman. Bu biroz vaqt olishi mumkin. Jarayonni boshlaymi?`,
    createInlineKeyboard([
      [
        ["Xa 👌", "yes"],
        ["Yo'q 🙅‍♂️", "no"],
      ],
    ])
  );
});

module.exports = { importAbonentsScene };
