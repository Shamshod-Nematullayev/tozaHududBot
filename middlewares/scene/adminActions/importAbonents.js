const { Scenes } = require("telegraf");
const { Abonent } = require("../../../models/Abonent");
const { Mahalla } = require("../../../models/Mahalla");

const importAbonentsScene = new Scenes.WizardScene(
  "import_abonents_data",
  async (ctx) => {
    try {
      ctx.wizard.state.XENC = ctx.message.text;
      ctx.reply("Endi Cookie qiymatini kiriting");
      ctx.wizard.next();
    } catch (error) {
      console.error(error);
    }
  },
  async (ctx) => {
    if (ctx.message.text == `👨‍💻 Ish maydoni`) return ctx.scene.leave();
    ctx.wizard.state.COOKIE = ctx.message.text;
    const date = new Date();
    ctx.reply("Qabul qilindi, iltimos kutib turing");
    const mahallalar = await Mahalla.find({ reja: { $gt: 0 } });
    // mahallalar.forEach(async (mfy, indexMFY) => {
    let indexMFY = 0;
    async function fech() {
      const mfy = mahallalar[indexMFY];
      const res = await fetch(
        "https://cleancity.uz/ds?xenc=" + ctx.wizard.state.XENC,
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
            Cookie: ctx.wizard.state.COOKIE,
          },
          body: `mahallas_id=${mfy.id}&mes=${
            date.getMonth() + 1
          }&god=${date.getFullYear()}&page=1&rows=${2000}&sort=a.id&order=asc`,
          method: "POST",
          mode: "cors",
          credentials: "include",
        }
      );
      res
        .json()
        .then(async (data) => {
          if (!data.rows || data.rows.length < 1) {
            await ctx.reply("Nimadur xatolik yuz berdi");
            ctx.scene.leave();
          } else {
            await ctx.reply("Baza yangilanyapti...");
            data.rows.forEach(async (row) => {
              const abonent = await Abonent.findOne({ licshet: row.licshet });
              if (abonent) {
                await abonent.updateOne({
                  ...row,
                });
              } else {
                await Abonent.create({
                  ...row,
                });
              }
            });
            ctx
              .reply(
                `${mfy.name} yangilandi. ${indexMFY + 1} of ${
                  mahallalar.length
                }`
              )
              .finally(() => {
                indexMFY++;
                if (mahallalar.length !== indexMFY) fech();
              });
            ctx.scene.leave();
          }
        })
        .catch((err) => {
          console.log(err);
        });
    }
    fech();
  }
);

importAbonentsScene.enter((ctx) => {
  ctx.reply(
    `Abonentlar ma'lumotini import qilish uchun CleanCity tizimi XENC yo'lini kiriting`
  );
});

module.exports = { importAbonentsScene };
