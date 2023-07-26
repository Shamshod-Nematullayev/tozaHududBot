const nodeHtmlToImage = require("node-html-to-image");
const { bot } = require("../core/bot");
const fs = require("fs");
const fetch = require("node-fetch");
const {
  fetchEcopayTushum,
  fetchEcopayLogin,
  fetchEcoTranzaksiyalar,
} = require("./fetchEcopay");
const { drawAndSendTushum } = require("./drawTushum");

// har besh daqiqada ecopay session saqlash uchun fetch yuboradigan funksiya
// setInterval(async () => {
//   console.log({ tushum: await fetchEcopayTushum() });
// }, 0600 * 60 * 1000);
// fetchEcopayLogin();

// Har yarim soatda tushumni telegramga tashlaydigan funksiya
// setInterval(async () => {
//   const data = await fetchEcopayTushum();
//   console.log("Tushum tashlandi hukumdorim");
//   drawAndSendTushum(data);
//   fetchEcoTranzaksiyalar();
// }, 60 * 1000 * 60);
