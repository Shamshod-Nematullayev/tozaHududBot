const { Scenes, Markup } = require("telegraf");
const { Abonent } = require("../../../models/Abonent");
const isCancel = require("../../smallFunctions/isCancel");
const { messages } = require("../../../lib/messages");
const { keyboards, createInlineKeyboard } = require("../../../lib/keyboards");
const { find_one_by_pinfil_from_mvd } = require("../../../api/mvd-pinfil");
const isPinfl = require("../../smallFunctions/isPinfl");
const { CustomDataRequest } = require("../../../models/CustomDataRequest");
const { Nazoratchi } = require("../../../models/Nazoratchi");
const fs = require("fs");

const updateAbonentDatesByPinfl = new Scenes.WizardScene(
  "update_abonent_date_by_pinfil",
  async (ctx) => {
    const inspektor = await Nazoratchi.findOne({ telegram_id: ctx.from.id });
    if (!inspektor) {
      ctx.reply(
        "Siz ushbu amaliyotni bajarish uchun yetarli huquqga ega emassiz!"
      );
      return ctx.scene.leave();
    }
    ctx.wizard.state.inspector_id = inspektor._id;
    if (ctx.message && isCancel(ctx.message.text)) {
      ctx.reply("Bekor qilindi");
      return ctx.scene.leave();
    }
    if (isNaN(ctx.message.text))
      return ctx.reply(
        messages.enterOnlyNumber,
        keyboards[ctx.session.til].cancelBtn.resize()
      );
    if (ctx.message.text.length != 12)
      return ctx.reply(
        messages.enterFullNamber,
        keyboards[ctx.session.til].cancelBtn.resize()
      );
    const abonent = await Abonent.findOne({ licshet: ctx.message.text });
    if (!abonent) {
      return ctx.reply(
        "Siz kiritgan litsavoy kod bo'yicha abonent ma'lumoti topilmadi. Tekshirib qaytadan kiriting",
        keyboards.lotin.cancelBtn.resize()
      );
    }
    if (abonent.shaxsi_tasdiqlandi && abonent.shaxsi_tasdiqlandi.confirm) {
      return ctx.reply("Bu abonent ma'lumoti kiritilib bo'lingan");
    }
    ctx.replyWithHTML(
      `<b>${abonent.fio}</b>\n Pasport pinfil raqamini kiriting`
    );
    ctx.wizard.state.abonent = abonent;
    ctx.wizard.next();
  },
  async (ctx) => {
    // pinfil validatsiyasi
    if (ctx.message && isCancel(ctx.message.text)) {
      ctx.reply("Bekor qilindi");
      return ctx.scene.leave();
    }
    if (!isPinfl(ctx.message.text)) {
      return ctx.replyWithPhoto(
        "https://www.google.com/url?sa=i&url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3DZjJS0SoXq6A&psig=AOvVaw1IOqLHD3CndpvLm1vqLwHJ&ust=1679216266118000&source=images&cd=vfe&ved=0CBAQjRxqFwoTCPDp6ZqO5f0CFQAAAAAdAAAAABAE",
        {
          caption: messages.enterReallyPinfl,
          reply_markup: keyboards.lotin.cancelBtn.resize().reply_markup,
        }
      );
    }
    // shaxsiy ma'lumotlarni olish
    const customDates = await find_one_by_pinfil_from_mvd(ctx.message.text);
    if (!customDates.success) {
      return ctx.reply(customDates.message, keyboards.lotin.cancelBtn.resize());
    }
    if (customDates.first_name == "" || customDates.success === false) {
      return ctx.reply(
        "Ushbu fuqoroga tegishli ma'lumotlar topilmadi. PINFL to'g'ri kiritilganmikan tekshirib qaytadan kiriting",
        keyboards.lotin.cancelBtn.resize().reply_markup
      ); // agarda ma'lumotlar topilmasa
    }
    ctx.wizard.state.pinfl = ctx.message.text;
    ctx.wizard.state.customDates = customDates;
    // nazoratchiga tasdiqlash uchun yuborish
    await ctx.replyWithHTML(
      `<b>${customDates.last_name} ${customDates.first_name} ${customDates.middle_name}</b> <i>${customDates.birth_date}</i>\n Siz shu kishini nazarda tutyapsizmi?`,
      createInlineKeyboard([
        [
          ["Xa 👌", "yes"],
          ["Yo'q 🙅‍♂️", "no"],
        ],
      ])
    );
    ctx.wizard.next();
  },
  async (ctx) => {
    const customDates = ctx.wizard.state.customDates;
    if (ctx.message?.text)
      return await ctx.replyWithHTML(
        `<b>${customDates.last_name} ${customDates.first_name} ${customDates.middle_name}</b> <i>${customDates.birth_date}</i>\n Siz shu kishini nazarda tutyapsizmi?`,
        createInlineKeyboard([
          [
            ["Xa 👌", "yes"],
            ["Yo'q 🙅‍♂️", "no"],
          ],
        ])
      );
    switch (ctx.callbackQuery?.data) {
      case "yes":
        ctx.deleteMessage();
        const req = await CustomDataRequest.create({
          user: ctx.from,
          data: {
            ...ctx.wizard.state.customDates,
            pinfl: ctx.wizard.state.pinfl,
          },
          inspector_id: ctx.wizard.state.inspector_id,
          licshet: ctx.wizard.state.abonent.licshet,
        });
        let filename = "./uploads/" + Date.now() + ".png";
        if (!customDates.photo) {
          filename = "./lib/personicon.png";
        }
        fs.writeFile(filename, customDates.photo, "base64", async (err) => {
          if (err) throw err;

          await ctx.telegram.sendPhoto(
            process.env.CHANNEL_ID_SHAXSI_TASDIQLANDI,
            { source: filename },
            {
              caption: `KOD: ${ctx.wizard.state.abonent.licshet}\nPasport: ${customDates.last_name} ${customDates.first_name} ${customDates.middle_name} ${customDates.birth_date}\nBilling: ${ctx.wizard.state.abonent.fio}\nInspector: <a href="https://t.me/${ctx.from.username}">${ctx.from.first_name}</a>`,
              reply_markup: createInlineKeyboard([
                [
                  ["✅✅", "shaxsitasdiqlandi_" + req._id + "_true"],
                  ["🙅‍♂️🙅‍♂️", "shaxsitasdiqlandi_" + req._id + "_false"],
                ],
              ]).oneTime().reply_markup,
              parse_mode: "HTML",
            }
          );
          ctx.reply(
            "Rahmat 😇\nMa'lumotlar tizim adminiga o'rganish uchun yuborildi.."
          );

          ctx.scene.leave();
        });
        break;
      case "no":
        ctx.deleteMessage();
        ctx.reply("Bekor qilindi. Demak PINFL raqami noto'g'ri ekan");
        ctx.scene.leave();
        break;
    }
  }
);

updateAbonentDatesByPinfl.enter((ctx) => {
  ctx.reply(`Abonent shaxsiy raqamini kiriting`);
});

module.exports = { updateAbonentDatesByPinfl };
