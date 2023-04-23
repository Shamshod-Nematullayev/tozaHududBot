const { Markup } = require("telegraf");
const mahallalar = require("../lib/mahallalar.json");

function mahallaKeys() {
  let arr = [];
  mahallalar.forEach((mfy, i) => {
    arr.push([Markup.button.callback(mfy.name, "mahalla_" + mfy.id)]);
  });
  return arr;
}
module.exports.keyboards = {
  lotin: {
    mainKeyboard: Markup.keyboard([
      ["👤Yangi abonent ochish", "✏️Ma'lumotlarini o'zgartirish"],
      ["👥Mening abonentlarim", "🔎Izlash"],
      ["📓Qo`llanma", "⚙Sozlamalar"],
    ]),
    editData: Markup.inlineKeyboard([
      [Markup.button.callback("📓Pasport ma'lumotlarini o'zgartirish")],
      ["Ism Familiyasini o'zgartirish"],
      ["🔌 Hisob raqamini o'zgartirish"],
      ["📱Raqamini o'zgartirish"],
      ["🏘Kadastr raqamini o'zgartirish"],
    ]),
    searchType: Markup.inlineKeyboard([
      Markup.button.callback("Litsavoy orqali", "searchByID"),
      Markup.button.callback("F.I.O orqali", "searchByFISH"),
    ]),
    cancelBtn: Markup.keyboard(["🚫Bekor qilish"]),
    mahallalar: Markup.inlineKeyboard(mahallaKeys()),
    adminAnswerKeyboard: Markup.keyboard(["🚫Bekor qilish", "Chiqish"]),
    editTypes: Markup.inlineKeyboard([
      Markup.button.callback("O'lim guvohnoma", "o'lim guvohnomasi"),
    ]),
    settings: Markup.inlineKeyboard([
      [Markup.button.callback("Tilni o'zgartirish", "language")],
    ]),
    chooseLanguge: Markup.inlineKeyboard([
      Markup.button.callback("Lotin", "lotin_tili_tanlash"),
      Markup.button.callback("Кирилл", "kiril_tili_tanlash"),
    ]),

    adminKeyboard: Markup.keyboard([["👨‍💻 Ish maydoni", "Tushumni tashlash"]]),

    adminWorkSpace: Markup.inlineKeyboard([
      [
        Markup.button.callback(
          "Bildirish xati kiritish",
          "add_notification_letter"
        ),
      ],
    ]),
    chooseIncomeType: Markup.inlineKeyboard([
      Markup.button.callback("MFY", "mfy"),
      Markup.button.callback("INSPEKTOR", "inspektor"),
    ]),
  },
  kiril: {
    mainKeyboard: Markup.keyboard([
      ["👤Янги абонент", "✏️Тахрирлаш"],
      ["👥Менинг абонентларим", "🔎Излаш"],
      ["📓Қўлланма", "⚙Созламалар"],
    ]),
    editData: Markup.inlineKeyboard([
      [Markup.button.callback("📓Pasport ma'lumotlarini o'zgartirish")],
      ["Ism Familiyasini o'zgartirish"],
      ["🔌 Hisob raqamini o'zgartirish"],
      ["📱Raqamini o'zgartirish"],
      ["🏘Kadastr raqamini o'zgartirish"],
    ]),
    searchType: Markup.inlineKeyboard([
      Markup.button.callback("Лицавой орқали", "searchByID"),
      Markup.button.callback("Ф.И.О орқали", "searchByFISH"),
    ]),
    cancelBtn: Markup.keyboard(["🚫Бекор қилиш"]),
    mahallalar: Markup.inlineKeyboard(mahallaKeys()),
    adminAnswerKeyboard: Markup.keyboard(["🚫Бекор қилиш", "Chiqish"]),
    editTypes: Markup.inlineKeyboard([
      Markup.button.callback("Ўлим гувохномаси", "o'lim guvohnomasi"),
    ]),
    settings: Markup.inlineKeyboard([
      [Markup.button.callback("Тилни ўзгартириш", "language")],
    ]),
    chooseLanguge: Markup.inlineKeyboard([
      Markup.button.callback("Lotin", "lotin_tili_tanlash"),
      Markup.button.callback("Кирилл", "kiril_tili_tanlash"),
    ]),
    adminKeyboard: Markup.keyboard([[["👨‍💻 Иш майдони", "Тушумни ташлаш"]]]),
  },
};
