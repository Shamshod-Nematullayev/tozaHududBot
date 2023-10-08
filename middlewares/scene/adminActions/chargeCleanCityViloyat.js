const { Scenes } = require("telegraf");
const { keyboards } = require("../../../lib/keyboards");

const chargeCleanCityViloyatScene = new Scenes.WizardScene(
  "CHARGE_VILOYAT_LOGIN",
  (ctx) => {
    try {
      const { wizard } = ctx;
      wizard.state.XENC = ctx.message.text;
      ctx.reply("Cookie qiymatini kiriting");
      wizard.next();
    } catch (err) {
      console.log(err);
      ctx.reply("Xatolik");
    }
  },
  async (ctx) => {
    try {
      const date = new Date();
      const { wizard } = ctx;
      wizard.state.COOKIE = ctx.message.text;
      const res = await fetch(
        "https://cleancity.uz/ds?xenc=" + wizard.state.XENC,
        {
          headers: {
            accept: "application/json, text/javascript, */*; q=0.01",
            "accept-language": "en-GB,en-US;q=0.9,en;q=0.8,uz;q=0.7",
            "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
            "sec-ch-ua":
              '"Google Chrome";v="117", "Not;A=Brand";v="8", "Chromium";v="117"',
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": '"Windows"',
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "x-requested-with": "XMLHttpRequest",
            Cookie: "JSESSIONID=" + wizard.state.COOKIE,
          },
          body: `mes=${
            date.getMonth() + 1
          }&god=${date.getFullYear()}&from_day=${date.getDate()}&to_day=${date.getDate()}&gov_level=1&sort=id&order=asc`,
          method: "POST",
          mode: "cors",
          credentials: "include",
        }
      );
      const data = await res.json();
      if (data.rows && data.rows.length > 0) {
        ctx.reply("Muvaffaqqiyatli ulanildi");
        process.env.XENC = wizard.state.XENC;
        process.env.COOKIE = wizard.state.COOKIE;
        ctx.scene.leave();
      } else {
        console.log(res)
        console.log(data)
        ctx.reply(
          "Nimadur noto'g'ri ketdi",
          keyboards.lotin.adminKeyboard.resize()
        );
        ctx.scene.leave();
      }
    } catch (err) {
      console.log(err);
      ctx.reply("Xatolik");
    }
  }
);

chargeCleanCityViloyatScene.enter((ctx) => {
  ctx.reply("XENC yo'lini kiriting!");
});

module.exports = { chargeCleanCityViloyatScene };
