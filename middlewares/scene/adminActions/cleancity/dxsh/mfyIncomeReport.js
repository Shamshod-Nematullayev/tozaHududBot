// ==============================================================
const { Composer } = require("telegraf");
const { bot } = require("../../../../../core/bot");
const { CleanCitySession } = require("../../../../../models/CleanCitySession");
const { JSDOM } = require("jsdom");
const { Mahalla } = require("../../../../../models/Mahalla");
const ejs = require("ejs");
const nodeHtmlToImage = require("node-html-to-image");
const path = require("path");
const fs = require("fs");

// ==============================================================
// MAIN FUNCTION

const composer = new Composer();

const mfyIncomeReport = async (ctx = false) => {
  const sessions = await CleanCitySession.find({
    type: "dxsh",
    active: true,
  });

  //   Foydalanuvchi tomonidan kiritilgan va hozirda aktiv bo'lgan sessionlar topilmaganda session yaratish sahnasiga o'tkazib yuboriladi
  if (sessions.length < 1 && ctx) {
    await ctx.reply(`Faol sessiyalar mavjud emas qaytadan login qiling`);
    // session yaratish sahnasi va callback function shu joyida tugab yangi sahna boshlanadi
    await ctx.scene.enter("login_clean_city");
    return;
  }
  //   foydalanuvchi kiritgan har bir session bo'yicha tushumlar tahlili qilinadi
  sessions.forEach(async (session) => {
    try {
      // bosh sahifani yuklab olish
      const resHomePage = await fetch(`https://cleancity.uz/startpage`, {
        headers: {
          Cookie: session.cookie,
        },
      });
      // Tushumlar tahliliga o'tkazadigan linkni aniqlash
      const textHomePage = await resHomePage.text();
      const docHomePage = new JSDOM(textHomePage).window.document;
      // Mana o'sha link => tushumlar tahlili sahifasiga
      if (
        !docHomePage.querySelector(
          "#g_acccordion > div > div:nth-child(5) > ul > li:nth-child(4) > a"
        ) &&
        ctx
      ) {
        const msg = await ctx.reply(
          `Faol sessiyalar mavjud emas qaytadan login qiling`
        );
        ctx.session.messages_for_delete.push(msg.message_id);
        // session yaratish sahnasi va callback function shu joyida tugab yangi sahna boshlanadi
        ctx.session.session_type = "dxsh";
        await ctx.scene.enter("recover_clean_city_session");
        return;
      }
      const jamiTushumlarTahliliPath = docHomePage.querySelector(
        "#g_acccordion > div > div:nth-child(5) > ul > li:nth-child(4) > a"
      ).href;

      // Tushumlar tahlili sahifasini yuklab olish
      const resTushumlarTahlili = await fetch(
        `https://cleancity.uz/startpage` + jamiTushumlarTahliliPath,
        {
          headers: {
            Cookie: session.cookie,
          },
        }
      );
      // Ma'lumotlarni json shaklida beradigan linkni aniqlash
      const textTushumlarTahliliPage = await resTushumlarTahlili.text();
      const url = textTushumlarTahliliPage
        .match(/url:\s*'([^']+)'/g)[0]
        .split("'")[1];
      let myHeaders = new Headers();
      myHeaders.append("Cookie", session.cookie);
      myHeaders.append("Content-Type", "application/x-www-form-urlencoded");
      let urlencoded = new URLSearchParams();
      const date = new Date();
      urlencoded.append("mes", date.getMonth() + 1);
      urlencoded.append("god", date.getFullYear());
      urlencoded.append("companies_id", "1144");
      urlencoded.append("sort", "id");
      urlencoded.append("order", "desc");
      const requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: urlencoded,
        redirect: "follow",
      };
      fetch("https://cleancity.uz/" + url, requestOptions)
        .then((response) => response.json())
        .then(async (result) => {
          // linkni mongodb sessionga qo'shib qo'yish keyinchalik ishlatish uchun
          await session.updateOne({ $set: { "path.getIncomes": url } });
          // tushumlar tahlilini telegram guruhlarga yuborish
          const mahallalar = [];
          let i = 0;
          // mahallalar ma'lumotlarini birlashtirib bitta arrayga olish
          const func = async () => {
            const row = result.rows[i];
            const mahalla = await Mahalla.findOne({ id: row.id });
            if (mahalla && mahalla.reja > 0) {
              mahallalar.push({
                id: row.id,
                xisoblandi: mahalla.reja,
                name: row.name,
                tushum: Number(row.ab_all_amount),
                nazoratchi: mahalla.biriktirilganNazoratchi,
              });
            }
            i++;
            if (i < result.rows.length) await func();
          };
          await func();

          // Tayyor array bilan hisobotni chizish
          let jamiXisoblandi = 0;
          let jamiTushum = 0;
          mahallalar.sort(
            (a, b) =>
              parseFloat(b.tushum / b.xisoblandi) -
              parseFloat(a.tushum / a.xisoblandi)
          );
          mahallalar.forEach((mfy, index) => {
            jamiXisoblandi += mfy.xisoblandi;
            jamiTushum += mfy.tushum;
          });
          const sana = `${date.getDate()} ${
            date.getMonth() + 1
          } ${date.getFullYear()} ${date.getHours()}:${date.getMinutes()}`;
          ejs.renderFile(
            path.join(__dirname, `../../../../../views/mfyIncome.ejs`),
            { data: mahallalar, jamiTushum, jamiXisoblandi, sana },
            {},
            async (err, str) => {
              if (err) {
                ctx.reply("Hisobot render qilishda xatolik");
                return console.log(err);
              }
              nodeHtmlToImage({
                output: "./income.png",
                html: str,
                type: "png",
                encoding: "binary",
                selector: "div",
              })
                .then(() => {
                  if (ctx)
                    ctx.replyWithPhoto({ source: "./income.png" }).then(() => {
                      fs.unlink("./income.png", (err) => {
                        if (err) throw err;
                      });
                    });
                  else
                    bot.telegram
                      .sendPhoto(
                        process.env.NAZORATCHILAR_GURUPPASI,
                        { source: "./income.png" },
                        {
                          caption: `Coded by <a href="https://t.me/oliy_ong_leader">Oliy Ong</a>`,
                          parse_mode: "HTML",
                        }
                      )

                      .then(() => {
                        fs.unlink("./income.png", (err) => {
                          if (err) throw err;
                        });
                      });
                })
                .catch((err) => {
                  if (ctx) ctx.reply("Hisobotni rasmga o'girishda xatolik");
                  console.log(err);
                });
            }
          );
        })
        .catch((error) => {
          // xatolik kuzatilsa foydalanuvchi va developerga yetkazish
          console.error("error", error);
          ctx.reply("xatolik tushumlar ma'lumotini json formatida olishda");
        });
    } catch (error) {
      console.error(new Error(error));
    }
  });
};

// =========== EXPORT ======================//
composer.action("mfy_income_report", mfyIncomeReport);
module.exports = { mfyIncomeReport };
bot.use(composer);
