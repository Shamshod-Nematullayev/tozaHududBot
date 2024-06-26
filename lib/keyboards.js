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
      [["F.I.O orqali", "SEARCH_BY_NAME"]],
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
        ["O'lim guvohnoma", "GUVOHNOMA_KIRITISH"],
        // ["Pasport rasmini kiritish", "fuqoro_rasmi"],
      ],
      [
        ["Yashovchi sonini ko'paytirish", "multiply_livings"],
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
      ["👨‍💻 Ish maydoni"],
      ["Aborotka chiqorish", "OGOHLANTIRISH XATLARI IMPORT"],
      ["ExportWarningLettersZip", "ExportAbonentCards"],
      ["pochtaHarajatiniTekshirishScene"],
    ]),

    adminWorkSpace: createInlineKeyboard([
      [["Yangi abonent", "new_abonent"]],
      [
        ["Bildirish xati kiritish", "add_notification"],
        ["Shaxsi tasdiqlandi", "shaxsi_tashdiqlandi_bildirish_xati"],
      ],
      [
        ["OX generation", "generate_alert_letter"],
        ["SB generation", "sudBuyruqlariYaratish"],
      ],
      [
        ["generateSavdoSanoatAriza", "generateSavdoSanoatAriza"],
        ["generateProkuraturaSudAriza", "generateProkuraturaSudAriza"],
      ],
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
      [["Sudga chiqorish", "get_sud_material"]],
      [["Ommaviy sharnoma biriktirish", "ommaviy_shartnoma_biriktirish"]],
    ]),
    stm_xodimi_main_keyboard: createInlineKeyboard([
      [["Sessiyani yangilash", "CHARGE_VILOYAT_LOGIN"]],
      [["Oylik reja belgilash", "set_monthly_plan"]],
      [["Hisobot 3", "viloyat_hisobot_3"]],
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
        ["Ф.И.О орқали", "SEARCH_BY_NAME"],
      ],
    ]),
    cancelBtn: Markup.keyboard(["🚫Бекор қилиш"]),
    mahallalar: Markup.inlineKeyboard(mahallaKeys()),
    adminAnswerKeyboard: Markup.keyboard(["🚫Бекор қилиш", "Chiqish"]),
    editTypes: createInlineKeyboard([
      [
        ["Ўлим гувохномаси", "GUVOHNOMA_KIRITISH"],
        // ["Фуқоро билан расм", "fuqoro_rasmi"],
      ],
      [
        ["Яшовчи сонини кўпайтириш", "multiply_livings"],
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
      ["Aborotka chiqorish", "OGOHLANTIRISH XATLARI IMPORT"],
      ["ExportWarningLettersZip", "ExportAbonentCards"],
      ["pochtaHarajatiniTekshirishScene"],
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
//   ["🔌 Hisob raqamini o'zgartirish"],
//   ["📱Raqamini o'zgartirish"],
//   ["🏘Kadastr raqamini o'zgartirish"],
// ]),
