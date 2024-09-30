const { CleanCitySession } = require("../models/CleanCitySession");
const { Nazoratchi } = require("../models/Nazoratchi");

// Pasport kiritish bo'yicha nazoratchilar kesimida hisobot
setInterval(async () => {
  const date = new Date();
  if (date.getMinutes() % 10 !== 9) return;

  const sessions = await CleanCitySession.find();
  sessions.forEach((session) => {
    fetch("https://cleancity.uz/startpage", {
      headers: {
        Cookie: session.cookie,
      },
    });
  });
}, 1000 * 60);
