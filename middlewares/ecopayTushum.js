const { fetchEcopayTushum, fetchEcoTranzaksiyalar } = require("./fetchEcopay");
const { drawAndSendTushum } = require("./drawTushum");

// har besh daqiqada ecopay session saqlash uchun fetch yuboradigan funksiya
// setInterval(async () => {
//   console.log({ tushum: await fetchEcopayTushum() });
// }, 0600 * 60 * 1000);
// fetchEcopayLogin();

// Har yarim soatda tushumni telegramga tashlaydigan funksiya
setInterval(async () => {
  let vaqt = new Date(Date.now());
  if (vaqt.getHours() > 19 || vaqt.getHours < 6) {
  } else {
    const data = await fetchEcopayTushum();
    drawAndSendTushum(data);
    fetchEcoTranzaksiyalar();
  }
}, 60 * 1000 * 60);
