const { Scenes } = require("telegraf");
const getQarziYoqMalumotnomaHTML = require("../../../../../api/cleancity/dxsh/getQarziYoqMalumotnomaHTML");
const { htmlPDF, fs } = require("../../../../../requires");

const getMalumotnomalar = new Scenes.WizardScene(
  "getMalumotnomalar",
  async (ctx) => {
    // Split the string into an array
    const abonents = ctx.message.text.trim().split(/\s+/);
    console.log(abonents, abonents.length);
    let counter = 0;
    async function loop() {
      if (counter == abonents.length) {
        ctx.reply("Tamamlandi!");
        ctx.scene.leave();
        return;
      }
      const row = abonents[counter];
      const html = await getQarziYoqMalumotnomaHTML(row);
      ctx.reply(counter + 1);
      fs.writeFile("./uploads/" + row + ".html", html, (err) => {
        ctx.replyWithDocument({ source: "./uploads/" + row + ".html" });
      });
      counter++;
      loop();
      //   htmlPDF
      //     .create(html, {
      //       orientation: "portrait",
      //       height: "1500mm",
      //     })
      //     .toFile("./uploads/qarziYoq.pdf", async (err, res) => {
      //       if (err) throw err;
      //       await ctx.replyWithDocument({
      //         source: "./uploads/qarziYoq.pdf",
      //         filename: `${row}.pdf`,
      //       });
      //       fs.unlink("./uploads/qarziYoq.pdf", (err) => {
      //         err ? console.log(err) : "";
      //         counter++;
      //         loop();
      //       });
      //     });
    }
    loop();
  }
);

getMalumotnomalar.enter((ctx) => {
  ctx.reply("Abonent kodlarini kiriting. (105120500001 105120600213)");
});

module.exports = { getMalumotnomalar };
