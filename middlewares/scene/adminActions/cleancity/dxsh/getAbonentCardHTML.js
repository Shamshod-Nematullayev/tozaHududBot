const { Scenes } = require("telegraf");
const { Abonent } = require("../../../../../models/Abonent");

const get_abonent_cards_html = new Scenes.WizardScene(
  "get_abonent_cards_html",
  async (ctx) => {
    if (ctx.message && isCancel(ctx.message.text)) return ctx.scene.leave();
    let arr = [];
    ctx.message.text.split("\n").forEach((txt) => {
      if (txt != "") arr.push(...txt.split(" "));
    });
    ctx.wizard.state.abonents = arr;
    arr.forEach(kod => {
        const abonent = await Abonent.
    })
  }
);

get_abonent_cards_html.enter((ctx) => ctx.reply("Abonent kodlarini kiriting"));
