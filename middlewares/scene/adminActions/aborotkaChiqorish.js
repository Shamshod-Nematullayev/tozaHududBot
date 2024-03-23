const { Scenes } = require("telegraf");
const { keyboards, createInlineKeyboard } = require("../../../lib/keyboards");
const { Abonent } = require("../../../models/Abonent");
const xlsx = require("json-as-xlsx");
const { Mahalla } = require("../../../models/Mahalla");
const path = require("path");

const aborotkaChiqorish = new Scenes.WizardScene(
  "draw_abarotka",
  async (ctx) => {
    try {
      // ctx.scene.leave();
      // return;
      const [keyword, id] = ctx.callbackQuery.data.split("_");
      if (keyword === "mahalla") {
        ctx.wizard.state.mfy_id = parseInt(id);
        ctx.deleteMessage();
        await ctx.reply(
          "Hozir billingdan ma'lumotlarni yangilaymi?",
          createInlineKeyboard([
            [
              ["Xa 👌", "yes"],
              ["Yo'q 🙅‍♂️", "no"],
            ],
          ])
        );
        ctx.wizard.next();
      } else {
        throw new Error("Mahallalardan biri tanlanishi kutilayotgan edi");
      }
    } catch (err) {
      ctx.reply("Xatolik kuzatildi.. " + __filename);
      console.error(err);
    }
  },
  async (ctx) => {
    try {
      let abonents = [];
      ctx.deleteMessage();
      if (ctx.callbackQuery.data == "no") {
        ctx.reply("Tayyorlayapman");
        abonents = await Abonent.find({ mahallas_id: ctx.wizard.state.mfy_id });
      } else {
        // Bu yerda API tayyorlangandan keyin bazadan ma'lumotlarni olib o'sha bo'yicha ishlaydigan qilinadi. Hozircha faqat yo'q bo'yicha ishlab turamiz
      }
      let content = [];
      abonents = abonents.sort((a, b) => a.fio.localeCompare(b.fio));
      abonents.forEach((abonent, i) => {
        content.push({
          tartib: i + 1,
          licshet: abonent.licshet,
          fio: abonent.fio,
          street: abonent.streets_name,
          prescribed_cnt: abonent.prescribed_cnt,
          saldo_k: abonent.saldo_k,
          last_pay_amount: abonent.last_pay_amount,
          last_pay_date: abonent.last_pay_date
            ? abonent.last_pay_date.split(" ")[0]
            : "",
        });
      });
      const mahalla = await Mahalla.findOne({ id: ctx.wizard.state.mfy_id });

      const data = [
        {
          Sheet: "Abarotka",
          columns: [
            { label: "№", value: "tartib" },
            { label: "Лицевой", value: "licshet" },
            { label: "ФИО--" + mahalla.name, value: "fio" },
            { label: "Кўча", value: "street" },
            { label: "Я с", value: "prescribed_cnt" },
            { label: "Салдо охири", value: "saldo_k" },
            { label: "Охирги тўлов", value: "last_pay_amount" },
            { label: "_", value: "last_pay_date" },
          ],
          content,
        },
      ];

      const fileName = path.join(
        __dirname + "../../../../uploads/",
        "mahalla" + Date.now()
      );
      let settings = {
        fileName: fileName, // Name of the resulting spreadsheet
        extraLength: 3, // A bigger number means that columns will be wider
        writeMode: "writeFile", // The available parameters are 'WriteFile' and 'write'. This setting is optional. Useful in such cases https://docs.sheetjs.com/docs/solutions/output#example-remote-file
        writeOptions: {}, // Style options from https://docs.sheetjs.com/docs/api/write-options
        // RTL: true, // Display the columns from right-to-left (the default value is false)
      };
      await xlsx(data, settings);
      await ctx.replyWithDocument({ source: fileName + ".xlsx" });
      ctx.scene.leave();
    } catch (err) {
      ctx.reply("Xatolik kuzatildi.." + __filename);
      console.error(err);
    }
  }
);

aborotkaChiqorish.enter((ctx) => {
  ctx.reply(
    "Qaysi mahallaning aborotkasi kerak",
    keyboards.lotin.mahallalar.oneTime()
  );
});
aborotkaChiqorish.leave((ctx) => {
  ctx.reply("Tugadi", keyboards.lotin.adminKeyboard.resize());
});

module.exports = { aborotkaChiqorish };
