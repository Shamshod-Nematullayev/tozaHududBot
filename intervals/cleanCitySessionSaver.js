const { CleanCitySession } = require("../models/CleanCitySession");
const { Nazoratchi } = require("../models/Nazoratchi");

// Pasport kiritish bo'yicha nazoratchilar kesimida hisobot
setInterval(async () => {
  const date = new Date();
  if (date.getMinutes() % 10 !== 0) return;

  if (date.getMinutes() == 0) {
    if (
      date.getHours() == 11 &&
      date.getHours() == 13 &&
      date.getHours() == 15 &&
      date.getHours() == 17
    ) {
      const inspectors = await Nazoratchi.find();
      const sana = `${date.getDate()}.${date.getMonth()}.${date.getFullYear()} ${date.getHours()}:${date.getMinutes()}`;
    }
  }

  const sessions = await CleanCitySession.find();
  sessions.forEach((session) => {
    fetch("https://cleancity.uz/startpage", {
      headers: {
        Cookie: session.cookie,
      },
    });
  });
}, 1000 * 60);
