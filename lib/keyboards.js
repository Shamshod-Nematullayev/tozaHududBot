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
};
