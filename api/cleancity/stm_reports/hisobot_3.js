const {
  toSendDebitor,
} = require("../../../middlewares/scene/adminActions/cleancity/viloyat/toSendDebitorReport");
const tashkilotlar = require("../../../lib/tashkilotlar.json");
const { Hudud } = require("../../../models/Hudud");
const { viloyatJamiTushumlar } = require("./jamiTushumlar");
const nodeHtmlToImage = require("node-html-to-image");
const ejs = require("ejs");
const fs = require("fs");
const {
  clearMessages,
} = require("../../../middlewares/smallFunctions/clearMessagesForDelete");
function getObjectById(id) {
  // Find the object with matching id
  const found = tashkilotlar.find((item) =>
    item.hududlar.some((hudud) => hudud.id === id)
  );

  // Return the found object, or undefined if not found
  return found;
}
function formatNumber(number) {
  return (number / 1000000).toFixed(1).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
function formatDate(date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-based in JavaScript
  const year = date.getFullYear();

  return `${day}.${month}.${year}`;
}
// Function to format a time
function formatTime(date) {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${hours}:${minutes}`;
}

// Example usage
const date = new Date(2024, 5, 11, 18, 5); // 11th June 2024, 18:05
const formattedTime = formatTime(date);

async function hisobot_3(ctx) {
  try {
    const res = await ctx.reply("Iltimos biroz kutib turing");
    ctx.session.messages_for_delete.push(res.message_id);
    const date = new Date();
    const debitorlikRows = await toSendDebitor();
    const jamiViloyat = {
      debitor: 0,
      daily_plan: 0,
      daily_income: 0,
      monthly_plan: 0,
      monthly_income: 0,
    };
    const newRows = [];
    const hududlar = await Hudud.find();
    const oylik_tushum = await viloyatJamiTushumlar(
      date.getMonth() + 1,
      date.getFullYear(),
      1,
      date.getDate()
    );
    const kunlik_tushum = await viloyatJamiTushumlar(
      date.getMonth() + 1,
      date.getFullYear(),
      date.getDate(),
      date.getDate()
    );

    debitorlikRows.forEach((row) => {
      const monthly_plan = hududlar.find(
        (item) => item.ID === row.id
      ).monthly_plan;
      const daily_plan = monthly_plan.summa / monthly_plan.muxlat;

      newRows.push({
        name: `<b>${
          getObjectById(row.id).hududlar.find((hudud) => hudud.id === row.id)
            .name
        }</b> <span style="color: #000000; font-family: 'Arial'; font-size: 22pt">${
          getObjectById(row.id).name
        }</span>`,
        debitor: formatNumber(row.debet_n),
        monthly_plan: formatNumber(monthly_plan.summa),
        daily_plan: formatNumber(daily_plan),
        daily_income: formatNumber(
          kunlik_tushum.find((item) => item.id === row.id).all_sum
        ),
        daily_plan_diff_summ: formatNumber(
          kunlik_tushum.find((item) => item.id === row.id).all_sum - daily_plan
        ),
        daily_plan_diff_procent:
          Math.floor(
            (kunlik_tushum.find((item) => item.id === row.id).all_sum /
              daily_plan) *
              1000
          ) / 10,
        monthly_income: formatNumber(
          oylik_tushum.find((item) => item.id === row.id).all_sum
        ),
        monthly_plan_diff_summ: formatNumber(
          oylik_tushum.find((item) => item.id === row.id).all_sum -
            monthly_plan.summa
        ),
        monthly_plan_diff_procent:
          Math.floor(
            (oylik_tushum.find((item) => item.id === row.id).all_sum /
              monthly_plan.summa) *
              1000
          ) / 10,
      });

      // Jami viloyat kesimida ko'rsatish uchun
      jamiViloyat.debitor += parseInt(
        hududlar.find((item) => item.ID === row.id).monthly_plan.summa
      );
      jamiViloyat.daily_plan += monthly_plan.summa / monthly_plan.muxlat;
      jamiViloyat.daily_income += parseInt(
        kunlik_tushum.find((item) => item.id === row.id).all_sum
      );
      jamiViloyat.monthly_income += parseInt(
        oylik_tushum.find((item) => item.id === row.id).all_sum
      );
      jamiViloyat.monthly_plan += monthly_plan.summa;
    });
    jamiViloyat.daily_plan_diff_summ = formatNumber(
      jamiViloyat.daily_income - jamiViloyat.daily_plan
    );
    jamiViloyat.monthly_plan_diff_summ = formatNumber(
      jamiViloyat.monthly_income - jamiViloyat.monthly_plan
    );
    jamiViloyat.daily_plan_diff_procent =
      Math.floor((jamiViloyat.daily_income / jamiViloyat.daily_plan) * 1000) /
        10 +
      "%";
    jamiViloyat.monthly_plan_diff_procent =
      Math.floor(
        (jamiViloyat.monthly_income / jamiViloyat.monthly_plan) * 1000
      ) / 10;
    jamiViloyat.debitor = formatNumber(jamiViloyat.debitor);
    jamiViloyat.daily_plan = formatNumber(jamiViloyat.daily_plan);
    jamiViloyat.daily_income = formatNumber(jamiViloyat.daily_income);
    jamiViloyat.monthly_plan = formatNumber(jamiViloyat.monthly_plan);
    jamiViloyat.monthly_income = formatNumber(jamiViloyat.monthly_income);

    const sana = formatDate(date);
    let html = ``;
    ejs.renderFile(
      "./views/viloyatHisobot.ejs",
      { rows: newRows, jamiViloyat, sana, vaqt: formatTime(date) },
      (err, res) => {
        if (err) throw err;

        html = res;
      }
    );
    await nodeHtmlToImage({
      html,
      selector: "table",
      type: "png",
      output: "./hisobot3.png",
    });
    await ctx.replyWithPhoto({ source: "./hisobot3.png" });
    fs.unlink("./hisobot3.png", (err) => {
      if (err) throw err;
    });
    clearMessages(ctx);
  } catch (error) {
    console.error(error);
  }
}

module.exports = { hisobot_3 };
