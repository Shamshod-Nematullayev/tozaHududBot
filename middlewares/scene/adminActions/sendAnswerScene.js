const { Scenes } = require("telegraf");
const { find_one_by_pinfil_from_mvd } = require("../../../api/mvd-pinfil");
const { keyboards } = require("../../../lib/keyboards");
const { messages } = require("../../../lib/messages");
const { CleanCitySession } = require("../../../models/CleanCitySession");
const { Abonent } = require("../../../models/YangiAbonent");
const isCancel = require("../../smallFunctions/isCancel");
const { kirillga } = require("../../smallFunctions/lotinKiril");
const qaysiMahalla = require("../../smallFunctions/qaysiMahalla");
const { yangiAbonent } = require("./cleancity/dxsh/yangiAbonent");
const cc = "https://cleancity.uz/";

const sendAnswerScene = new Scenes.WizardScene(
  "answer_to_inspector",
  async (ctx) => {
    try {
      if (ctx.message && isCancel(ctx.message.text)) {
        ctx.reply(
          messages.ogohlantirishKiriting,
          keyboards[ctx.session.til].adminAnswerKeyboard.resize()
        );
        return ctx.wizard.next();
      } else if (ctx.message && ctx.message.text == "Chiqish") {
        return ctx.scene.leave();
      } else if (ctx.message && ctx.message.text == "Kod ochish") {
        // Kod ochish tugmasi bosilganida
        // nazoratchi kiritgan ma'lumotni db dan olish
        const abonent = await Abonent.findById(ctx.session.abonent_id);
        // fuqoro ma'lumoti mvd dan olish
        const customDates = await find_one_by_pinfil_from_mvd(
          abonent.data.PINFIL
        );
        // agar mvd bazasida ma'lumot topilmasa
        if (customDates.first_name == "" || customDates.success === false) {
          ctx.reply(customDates.message);
          return;
          await Abonent.findByIdAndUpdate(ctx.session.abonent_id, {
            $set: { isCancel: true },
          });

          await ctx.telegram.sendMessage(
            abonent.user.id,
            `Siz yuborgan abonent bekor qilindi ⛔️\n <b>${
              abonent.data.FISH
            }</b>  ${qaysiMahalla(
              abonent.data.MFY_ID
            )} \n \n Asos:  "Ushbu fuqoroga tegishli ma'lumotlar topilmadi yoki PINFL noto'g'ri kiritildi"`,
            {
              parse_mode: "HTML",
            }
          );
          ctx.telegram.editMessageText(
            process.env.CHANNEL,
            abonent.messageIdChannel,
            0,
            `<a href="https://t.me/${ctx.from.username}">${ctx.from.first_name}</a>\n` +
              `<a href="https://t.me/${abonent.user.username}">${abonent.user.nikName}</a> tizimga kiritgan \nstatus: |⛔️BEKOR QILINDI⛔️|\n` +
              `<b>${abonent.data.FISH}</b>\n` +
              `mahalla: ${qaysiMahalla(abonent.data.MFY_ID)}\n` +
              `\npowered by <a href="https://t.me/oliy_ong">Oliy_Ong</a>`,
            {
              reply_markup: null,
              parse_mode: "HTML",
              disable_web_page_preview: true,
            }
          );
          return ctx.reply("Ushbu fuqoroga tegishli ma'lumotlar topilmadi");
        }
        // billingga ma'lumot kiritish uchun albatta session kerak
        const session = await CleanCitySession.findOne({ type: "dxsh" });

        // ko'cha ma'lumotini kiritish funksiyasi qo'yilmaydi. Bazada ushbu mahallaga biriktirilgan birinchi ko'chani qabul qilib ketadi
        let streets = await fetch(cc + "ds?DAO=StreetsDAO&ACTION=GETLISTALL", {
          method: "POST",
          headers: {
            accept: "application/json, text/javascript, */*; q=0.01",
            "accept-language": "en-GB,en-US;q=0.9,en;q=0.8,uz;q=0.7",
            "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
            Cookie: session.cookie,
          },
          body: `mahallas_id=${abonent.data.MFY_ID}`,
        });
        streets = await streets.json();
        streets = streets.rows;
        const yaratilganAbonent = await yangiAbonent({
          mfy_id: abonent.data.MFY_ID,
          fish: kirillga(
            `${customDates.last_name} ${customDates.first_name} ${customDates.middle_name}`
          ),
          passport_number: `${customDates.passport_serial}-${customDates.passport_number}`,
          pinfl: abonent.data.PINFIL,
          street_id: streets[0].id,
          yashovchi_soni: abonent.data.YASHOVCHILAR,
        });
        if (yaratilganAbonent.success) {
          await ctx.replyWithHTML(
            `Yangi abonent qo'shildi <code>${yaratilganAbonent.litschet}</code>`
          );
          await ctx.telegram.sendMessage(
            abonent.user.id,
            `Siz yuborgan abonentga kod ochildi.\n <b>${
              abonent.data.FISH
            }</b>  ${qaysiMahalla(abonent.data.MFY_ID)} \n \n <code>${
              yaratilganAbonent.litschet
            }</code>`,
            {
              parse_mode: "HTML",
            }
          );
          await ctx.telegram.editMessageText(
            process.env.CHANNEL,
            abonent.messageIdChannel,
            0,
            `<a href="https://t.me/${ctx.from.username}">${ctx.from.first_name}</a>\n` +
              `status: |✅BAJARILDI✅|\n` +
              `<b>${abonent.data.FISH}</b>\n` +
              `mahalla: ${qaysiMahalla(abonent.data.MFY_ID)}\n` +
              `kod: <code>${yaratilganAbonent.litschet}</code> \npowered by <a href="https://t.me/oliy_ong">Oliy_Ong</a>`,
            {
              reply_markup: null,
              parse_mode: "HTML",
              disable_web_page_preview: true,
            }
          );
          await ctx.telegram.forwardMessage(
            process.env.NAZORATCHILAR_GURUPPASI,
            process.env.CHANNEL,
            abonent.messageIdChannel
          );
          ctx.scene.leave();
        } else {
          ctx.reply(yaratilganAbonent.msg);
        }
      }
      await Abonent.findByIdAndUpdate(ctx.session.abonent_id, {
        $set: { kod: ctx.message.text },
      })
        .then((res) => {
          ctx.telegram
            .sendMessage(
              res.user.id,
              `Siz yuborgan abonentga kod ochildi.\n <b>${
                res.data.FISH
              }</b>  ${qaysiMahalla(res.data.MFY_ID)} \n \n <code>${
                ctx.message.text
              }</code>`,
              {
                parse_mode: "HTML",
              }
            )
            .then(() => {
              ctx.reply(messages.sended).then(async () => {
                const state = res.data;
                await ctx.telegram.editMessageText(
                  process.env.CHANNEL,
                  res.messageIdChannel,
                  0,
                  `<a href="https://t.me/${ctx.from.username}">${ctx.from.first_name}</a>\n` +
                    `status: |✅BAJARILDI✅|\n` +
                    `<b>${state.FISH}</b>\n` +
                    `mahalla: ${qaysiMahalla(state.MFY_ID)}\n` +
                    `kod: <code>${ctx.message.text}</code> \npowered by <a href="https://t.me/oliy_ong">Oliy_Ong</a>`,
                  {
                    reply_markup: null,
                    parse_mode: "HTML",
                    disable_web_page_preview: true,
                  }
                );
                await ctx.telegram.forwardMessage(
                  process.env.NAZORATCHILAR_GURUPPASI,
                  process.env.CHANNEL,
                  res.messageIdChannel
                );
                ctx.scene.leave();
              });
            });
        })
        .catch(() => {
          ctx.reply(
            messages.kodOchilmadi,
            keyboards[ctx.session.til].adminAnswerKeyboard.resize()
          );
        });
    } catch (error) {
      console.log(error);
    }
  },
  async (ctx) => {
    if (ctx.message && ctx.message.text == "Chiqish") {
      return ctx.scene.leave();
    }
    await Abonent.findByIdAndUpdate(ctx.session.abonent_id, {
      $set: { isCancel: true },
    })
      .then((res) => {
        ctx.reply(messages.sended);
        ctx.telegram
          .sendMessage(
            res.user.id,
            `Siz yuborgan abonent bekor qilindi ⛔️\n <b>${
              res.data.FISH
            }</b>  ${qaysiMahalla(res.data.MFY_ID)} \n \n Asos:  ${
              ctx.message.text
            }`,
            {
              parse_mode: "HTML",
            }
          )
          .then(() => {
            const state = res.data;
            ctx.telegram
              .editMessageText(
                process.env.CHANNEL,
                res.messageIdChannel,
                0,
                `<a href="https://t.me/${ctx.from.username}">${ctx.from.first_name}</a>\n` +
                  `<a href="https://t.me/${res.user.username}">${res.user.nikName}</a> tizimga kiritgan \nstatus: |⛔️BEKOR QILINDI⛔️|\n` +
                  `<b>${state.FISH}</b>\n` +
                  `mahalla: ${qaysiMahalla(state.MFY_ID)}\n` +
                  `\npowered by <a href="https://t.me/oliy_ong">Oliy_Ong</a>`,
                {
                  reply_markup: null,
                  parse_mode: "HTML",
                  disable_web_page_preview: true,
                }
              )
              .then(() => {
                return ctx.scene.leave();
              });
          });
      })
      .catch((err) => {
        return ctx.reply(messages.errorOccured);
      });
  }
);

sendAnswerScene.enter((ctx) => {
  ctx.reply(
    messages.enterAbonentKod,
    keyboards[ctx.session.til].adminAnswerKeyboard.resize()
  );
});

sendAnswerScene.leave((ctx) => {
  ctx.reply(
    messages.heyAdmin,
    keyboards[
      ctx.session.til ? ctx.session.til : "lotin"
    ].adminKeyboard.resize()
  );
});

module.exports = sendAnswerScene;
