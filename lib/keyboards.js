const { Markup } = require("telegraf");
const mahallalar = require("../lib/mahallalar.json");

function mahallaKeys() {
  let arr = [];
  function compare(a, b) {
    if (a.name < b.name) {
      return -1;
    }
    if (a.name > b.name) {
      return 1;
    }
    return 0;
  }

  mahallalar.sort(compare);
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
      [
        Markup.button.callback("O'lim guvohnoma", "o'lim guvohnomasi"),

        Markup.button.callback("Pasport rasmini kiritish", "fuqoro_rasmi"),
      ],
      [
        Markup.button.callback(
          "Yashovchi sonini ko'paytirish",
          "multply livings"
        ),
        Markup.button.callback(
          "📱 Telefon raqamini ulash",
          "connect_phone_number"
        ),
      ],
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
        Markup.button.callback("Abonent rasmi", "show_abonent_pic"),
      ],
      [
        Markup.button.callback("OX generation", "generate_alert"),
        Markup.button.callback("SB generation", "generate_sud_buyruq"),
      ],
      [Markup.button.callback("O'lim guvohnomasi ijro", "game_over_play")],
      [Markup.button.callback("Reja belgilash", "set_plan_for_inspectors")],
      [Markup.button.callback("Viloyat LOGIN", "CHARGE_VILOYAT_LOGIN")],
      [
        Markup.button.callback(
          "Abonentlar bazasini yangilash",
          "import_abonents_data"
        ),
      ],
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
      [
        Markup.button.callback("Ўлим гувохномаси", "o'lim guvohnomasi"),
        Markup.button.callback("Фуқоро билан расм", "fuqoro_rasmi"),
      ],
      [
        Markup.button.callback("Яшовчи сонини кўпайтириш", "multply livings"),
        Markup.button.callback("📱 Телефон рақам", "connect_phone_number"),
      ],
    ]),
    settings: Markup.inlineKeyboard([
      [Markup.button.callback("Тилни ўзгартириш", "language")],
    ]),
    chooseLanguge: Markup.inlineKeyboard([
      Markup.button.callback("Lotin", "lotin_tili_tanlash"),
      Markup.button.callback("Кирилл", "kiril_tili_tanlash"),
    ]),
    adminKeyboard: Markup.keyboard([["👨‍💻 Иш майдони", "Тушумни ташлаш"]]),
    adminWorkSpace: Markup.inlineKeyboard([
      [
        Markup.button.callback(
          "Билдириш хати киритиш",
          "add_notification_letter"
        ),

        Markup.button.callback("Фуқоро паспорти", "show_abonent_pic"),
      ],

      [
        Markup.button.callback(
          "Огохлантириш хати генератсия",
          "generate_alert"
        ),
      ],

      [Markup.button.callback("Viloyat LOGIN", "CHARGE_VILOYAT_LOGIN")],
    ]),
  },
};
