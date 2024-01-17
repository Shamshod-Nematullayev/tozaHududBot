const { Markup } = require("telegraf");
const mahallalar = require("../lib/mahallalar.json");

// ============ Helper functions ================
function mahallaKeys() {
  // Use localeCompare for string comparison
  const compare = (a, b) => a.name.localeCompare(b.name);

  // Create a sorted copy of mahallalar
  const sortedMahallalar = [...mahallalar].sort(compare);

  // Use map directly to generate the array of buttons
  const buttons = sortedMahallalar.map((mfy) => [
    Markup.button.callback(mfy.name, "mahalla_" + mfy.id),
  ]);

  return buttons;
}

function createInlineKeyboard(buttonDataArray) {
  const inlineKeyboard = buttonDataArray.map((buttonDataSet) => {
    return buttonDataSet.map(([buttonText, buttonCallback]) => {
      return Markup.button.callback(buttonText, buttonCallback);
    });
  });

  return Markup.inlineKeyboard(inlineKeyboard);
}

// ============ Keyboards

const keyboards = {
  lotin: {
    mainKeyboard: Markup.keyboard([
      ["👤Yangi abonent ochish", "✏️Ma'lumotlarini o'zgartirish"],
      ["👥Mening abonentlarim", "🔎Izlash"],
      ["📓Qo`llanma", "⚙Sozlamalar"],
    ]),
    searchType: createInlineKeyboard([
      [["Litsavoy orqali", "searchByID"]],
      [["F.I.O orqali", "searchByFISH"]],
    ]),
    cancelBtn: Markup.keyboard(["🚫Bekor qilish"]),
    mahallalar: Markup.inlineKeyboard(mahallaKeys()),
    adminAnswerKeyboard: Markup.keyboard([
      "Kod ochish",
      "🚫Bekor qilish",
      "Chiqish",
    ]),
    editTypes: createInlineKeyboard([
      [
        ["O'lim guvohnoma", "o'lim guvohnomasi"],
        // ["Pasport rasmini kiritish", "fuqoro_rasmi"],
      ],
      [
        ["Yashovchi sonini ko'paytirish", "multply livings"],
        ["📱 Telefon raqamini ulash", "connect_phone_number"],
      ],
      [["PASSPORT", "update_abonent_date_by_pinfil"]],
    ]),
    settings: createInlineKeyboard([[["Tilni o'zgartirish", "language"]]]),
    chooseLanguge: createInlineKeyboard([
      [
        ["Lotin", "lotin_tili_tanlash"],
        ["Кирилл", "kiril_tili_tanlash"],
      ],
    ]),

    adminKeyboard: Markup.keyboard([
      ["👨‍💻 Ish maydoni", "Tushumni tashlash"],
      ["Aborotka chiqorish"],
    ]),

    adminWorkSpace: createInlineKeyboard([
      [["Yangi abonent", "new_abonent"]],
      [
        ["Bildirish xati kiritish", "add_notification"],
        ["Shaxsi tasdiqlandi", "shaxsi_tashdiqlandi_bildirish_xati"],
      ],
      [
        ["OX generation", "generate_alert_letter"],
        ["SB generation", "generate_sud_buyruq"],
      ],
      [["generateSavdoSanoatAriza", "generateSavdoSanoatAriza"]],
      [["O'lim guvohnomasi ijro", "confirm_game_over"]],
      [["Reja belgilash", "import_plan_for_inspectors"]],
      [
        ["Viloyat LOGIN", "CHARGE_VILOYAT_LOGIN"],
        ["Tushum mfy", "mfy_income_report"],
      ],
      [["Abonentlar bazasini yangilash", "import_abonents_data"]],
      [
        ["MFY telegram guruhi", "connect_mfy_tg_group"],
        ["Nazoratchi telegram", "user_to_inspektor"],
      ],
      [["Ommaviy sharnoma biriktirish", "ommaviy_shartnoma_biriktirish"]],
    ]),
  },
  kiril: {
    mainKeyboard: Markup.keyboard([
      ["👤Янги абонент", "✏️Тахрирлаш"],
      ["👥Менинг абонентларим", "🔎Излаш"],
      ["📓Қўлланма", "⚙Созламалар"],
    ]),
    searchType: createInlineKeyboard([
      [
        ["Лицавой орқали", "searchByID"],
        ["Ф.И.О орқали", "searchByFISH"],
      ],
    ]),
    cancelBtn: Markup.keyboard(["🚫Бекор қилиш"]),
    mahallalar: Markup.inlineKeyboard(mahallaKeys()),
    adminAnswerKeyboard: Markup.keyboard(["🚫Бекор қилиш", "Chiqish"]),
    editTypes: createInlineKeyboard([
      [
        ["Ўлим гувохномаси", "o'lim guvohnomasi"],
        // ["Фуқоро билан расм", "fuqoro_rasmi"],
      ],
      [
        ["Яшовчи сонини кўпайтириш", "multply livings"],
        ["📱 Телефон рақам", "connect_phone_number"],
      ],
      [["PASSPORT", "update_abonent_date_by_pinfil"]],
    ]),
    settings: createInlineKeyboard([[["Тилни ўзгартириш", "language"]]]),
    chooseLanguge: createInlineKeyboard([
      [
        ["Lotin", "lotin_tili_tanlash"],
        ["Кирилл", "kiril_tili_tanlash"],
      ],
    ]),
    adminKeyboard: Markup.keyboard([
      ["👨‍💻 Иш майдони", "Тушумни ташлаш"],
      ["Aborotka chiqorish"],
    ]),
    adminWorkSpace: createInlineKeyboard([
      [
        ["Билдириш хати киритиш", "add_notification"],

        ["Фуқоро паспорти", "show_abonent_pic"],
      ],

      [["Огохлантириш хати генератсия", "generate_alert_letter"]],

      [["Viloyat LOGIN", "CHARGE_VILOYAT_LOGIN"]],
    ]),
  },
};

module.exports = { createInlineKeyboard, keyboards };
// Zahiradagi g'oyalar
// editData: createInlineKeyboard([
//   [Markup.button.callback("📓Pasport ma'lumotlarini o'zgartirish")],
//   ["Ism Familiyasini o'zgartirish"],
//   ["🔌 Hisob raqamini o'zgartirish"],
//   ["📱Raqamini o'zgartirish"],
//   ["🏘Kadastr raqamini o'zgartirish"],
// ]),
