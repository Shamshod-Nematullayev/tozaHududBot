const { bot } = require("../core/bot");
const fs = require("fs");
const ejs = require("ejs");
const nodeHtmlToImage = require("node-html-to-image");
const { CleanCitySession } = require("../models/CleanCitySession");
const { JSDOM } = require("jsdom");
const { Mahalla } = require("../models/Mahalla");

const mahallaGroup = {
  id: -1002104743021,
  title: "Тоза Худуд МФЙ раислари Каттақўрғон гурухи",
  type: "supergroup",
};

const getMahallaKunlikTushum = async (date = new Date()) => {
  const session = await CleanCitySession.findOne({ type: "dxsh" });
  // agar link mavjud bo'lsa mavjud bo'lsa ma'lumot olinadi va return qilinadi
  if (session.path.getDailyIncome && session.path.getDXSH1) {
    const res = await fetch(
      `https://cleancity.uz/` + session.path.getDailyIncome,
      {
        headers: {
          Cookie: session.cookie,
          accept: "application/json, text/javascript, */*; q=0.01",
          "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
        },
        body: `mes=${
          date.getMonth() + 1
        }&god=${date.getFullYear()}&from_day=${date.getDate()}&to_day=${date.getDate()}&option=0&system_companies_id=1144&sort=id&order=asc`,
        method: "POST",
      }
    );
    const res2 = await fetch(`https://cleancity.uz/` + session.path.getDXSH1, {
      headers: {
        Cookie: session.cookie,
        accept: "application/json, text/javascript, */*; q=0.01",
        "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
      },
      body: `mes=${
        date.getMonth() + 1
      }&god=${date.getFullYear()}&option=0&system_companies_id=1144&sort=id&order=asc`,
      method: "POST",
    });
    const res2Rows = (await res2.json()).rows;
    const rows = (await res.json()).rows;
    const mahallalar = await Mahalla.find({ reja: { $gt: 0 } });
    mahallalar.forEach((mfy) => {
      let topilmadi = true;
      rows.forEach((row) => {
        if (row.id == mfy.id) {
          topilmadi = false;
          return;
        }
      });
      if (topilmadi) {
        rows.push({
          id: mfy.id,
          name: mfy.name,
          summa_all: 0,
        });
      }
    });

    rows.forEach((row, i) => {
      res2Rows.forEach((dxsh1) => {
        if (row.id == dxsh1.id) {
          rows[i].debit = dxsh1.debet_n;
        }
      });
    });
    return rows;
  } else {
    // bosh sahifa
    const resHomePage = await fetch(`https://cleancity.uz/startpage`, {
      headers: {
        Cookie: session.cookie,
      },
    });
    // Tushumlar tahliliga o'tkazadigan linkni aniqlash
    const textHomePage = await resHomePage.text();
    const docHomePage = new JSDOM(textHomePage).window.document;
    let linkToGetDailyIncome = docHomePage.querySelectorAll("li.ilmenu");
    let a;
    let b;
    linkToGetDailyIncome.forEach((elem, i) => {
      if (elem.textContent.match(/ДХЖ-1 хисоботи/g) != null) {
        b = i;
      }
      if (elem.textContent.match(/Эл.туловлар хисоботи/g) != null) {
        a = i;
      }
    });
    let linkToDXSH1 = linkToGetDailyIncome[b].querySelector("a").href;
    linkToGetDailyIncome = linkToGetDailyIncome[a].querySelector("a").href;

    // Mana o'sha link => tushumlar tahlili sahifasiga
    let getDailyIncomePage = await fetch(
      `https://cleancity.uz/startpage` + linkToGetDailyIncome,
      {
        headers: {
          Cookie: session.cookie,
        },
      }
    );
    let getDXSH1Page = await fetch(
      `https://cleancity.uz/startpage` + linkToDXSH1,
      {
        headers: {
          Cookie: session.cookie,
        },
      }
    );
    getDailyIncomePage = await fetch(getDailyIncomePage.url, {
      headers: {
        Cookie: session.cookie,
      },
    });
    getDXSH1Page = await fetch(getDXSH1Page.url, {
      headers: {
        Cookie: session.cookie,
      },
    });
    getDailyIncomePage = await getDailyIncomePage.text();
    getDXSH1Page = await getDXSH1Page.text();
    const getDailyIncome = getDailyIncomePage
      .match(/url:\s*'ds([^']+)'/g)[1]
      .split("'")[1];
    const getDXSH1 = getDXSH1Page.match(/url:\s*'ds([^']+)'/g)[1].split("'")[1];
    await session.updateOne({
      "path.getDailyIncome": getDailyIncome,
      "path.getDXSH1": getDXSH1,
    });
    await getMahallaKunlikTushum(date);
    // elektron tushumlar hisoboti link
    // hisobotni json ko'rinishida olish link
    // linkni saqlash
    // funksiyani qayta chaqirish
  }
};

const drawMahallaKunlikTushum = async (data, date = Date.now()) => {
  let allDebit = 0;
  let allDailyIncome = 0;
  data = data.sort((a, b) => {
    return b.summa_all - a.summa_all;
  });
  data.forEach((row, i) => {
    allDebit += Number(row.debit);
    allDailyIncome += Number(row.summa_all);
    data[i].summa_all = Number(row.summa_all)
      .toLocaleString()
      .replace(/,/g, " ");
    data[i].debit = Math.floor(Number(row.debit))
      .toLocaleString()
      .replace(/,/g, " ");
  });

  allDebit = allDebit.toLocaleString().replace(/,/g, " ");
  allDailyIncome = allDailyIncome.toLocaleString().replace(/,/g, " ");
  // ejs faylini ishlab chiqish
  const currentDate = new Date(date);
  const day = currentDate.getDate();
  const month = currentDate.getMonth() + 1; // Months are zero-based, so add 1
  const year = currentDate.getFullYear();

  const formattedDate = `${day}.${month}.${year}`;
  let html = ``;
  ejs.renderFile(
    "./views/mahallaKunlikTushum.ejs",
    { rows: data, allDebit, allDailyIncome, formattedDate },
    (err, res) => {
      if (err) throw err;

      html = res;
    }
  );
  await nodeHtmlToImage({
    html,
    selector: "div",
    type: "png",
    output: "./kunlikTushum.png",
  });

  return "./kunlikTushum.png";
};

const sendMahallaKunlikTushum = async (receivers = [], imgPath, ctx) => {
  const data = await getMahallaKunlikTushum();
  // yuboriladigan id raqamlar massivi keladi va rasm massivdagi hammaga yuboriladi oxirida o'chirish yuboriladi

  receivers.forEach((to) => {
    bot.telegram.sendPhoto(to, { source: imgPath });
  });

  return;
  fs.unlink(imgPath, (err) => {
    if (err) throw err;

    if (ctx) {
      ctx.reply("Ma'lumotlar to'liq yuborildi Hukmdorim");
    }
  });
};

setInterval(() => {
  const date = new Date();
  //   const soat = date.getHours();
  const minut = date.getMinutes();
  if (minut == 0) {
    getMahallaKunlikTushum(date).then(async (rows) => {
      const imgPath = await drawMahallaKunlikTushum(rows, new Date());
      sendMahallaKunlikTushum([1382670100, mahallaGroup.id], imgPath);
    });
  }
}, 1000 * 60);

module.exports = {
  getMahallaKunlikTushum,
  drawMahallaKunlikTushum,
  sendMahallaKunlikTushum,
};
