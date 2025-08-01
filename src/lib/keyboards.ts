import { Markup } from "telegraf";

import mahallalar from "./mahallalar.js";

import { Mahalla } from "@models/Mahalla.js";
import {
  InlineKeyboardMarkup,
  ReplyKeyboardMarkup,
} from "telegraf/typings/core/types/typegram.js";

// ============ Helper functions ================
function mahallaKeys() {
  // Use localeCompare for string comparison
  const compare = (a: any, b: any) => a.name.localeCompare(b.name);

  // Create a sorted copy of mahallalar
  const sortedMahallalar = [...mahallalar].sort(compare);

  // Use map directly to generate the array of buttons
  const buttons = sortedMahallalar.map((mfy) => [
    Markup.button.callback(mfy.name, "mahalla_" + mfy.id),
  ]);

  return buttons;
}

/**
 *
 * @param buttonDataArray [[buttonText, buttonCallback]]
 * @returns InlineKeyboardMarkup
 */
export function createInlineKeyboard(
  buttonDataArray: Array<Array<[string, string]>>
): Markup.Markup<InlineKeyboardMarkup> {
  const inlineKeyboard = buttonDataArray.map((buttonDataSet) => {
    return buttonDataSet.map(([buttonText, buttonCallback]) => {
      return Markup.button.callback(buttonText, buttonCallback);
    });
  });

  return Markup.inlineKeyboard(inlineKeyboard);
}

async function nazoratchigaBiriktirilganMahallalar(
  companyId: number,
  inspector_id?: number
) {
  const filter = inspector_id
    ? {
        "biriktirilganNazoratchi.inspactor_id": inspector_id,
      }
    : {
        companyId,
      };
  const mahallalar = await Mahalla.find(filter);
  if (mahallalar.length == 0) {
    return;
  }
  const sortedMahallalar = mahallalar.sort((a, b) =>
    a.name.localeCompare(b.name)
  );
  const buttons = sortedMahallalar.map((mfy) => [
    Markup.button.callback(mfy.name, "mahalla_" + mfy.id),
  ]);
  return buttons;
}

// ============ Keyboards

export const keyboards = {
  nazoratchigaBiriktirilganMahallalar,
  mainKeyboard: Markup.keyboard([
    ["👤Yangi abonent ochish", "✏️Ma'lumotlarini o'zgartirish"],
    ["👥Mening abonentlarim", "🔎Izlash", "✉️Ogohlantrish xati"],
    ["📓Qo`llanma", "⚙Sozlamalar"],
    ["🔌 ELEKTR KODI🔌", "✒️Sudga xat✒️", "📅Abonent karta"],
    ["✅Abonentlar ro'yxati"],
  ]).resize(),
  cancelBtn: Markup.keyboard(["🚫Bekor qilish"]).resize(),
  mahallalar: Markup.inlineKeyboard(mahallaKeys()),
  adminAnswerKeyboard: Markup.keyboard([
    "Kod ochish",
    "🚫Bekor qilish",
    "Chiqish",
  ]),
  editTypes: createInlineKeyboard([
    // [
    //   ["O'lim guvohnoma", "GUVOHNOMA_KIRITISH"],
    //   // ["Ko'cha/qishloq", "changeAbonentStreet"],
    // ],
    [
      ["Yashovchi sonini ko'paytirish", "multiply_livings"],
      ["📱 Telefon raqamini ulash", "connect_phone_number"],
    ],
    [
      ["Ko'cha/qishloq", "changeAbonentStreet"],
      ["PASSPORT", "update_abonent_date_by_pinfil"],
    ],
  ]),
  settings: createInlineKeyboard([[["Tilni o'zgartirish", "language"]]]),
  chooseLanguge: createInlineKeyboard([
    [
      ["Lotin", "lotin_tili_tanlash"],
      ["Кирилл", "kiril_tili_tanlash"],
    ],
  ]),
  targetMenuKeyboard: createInlineKeyboard([
    [
      ["qo'shish", "createTarget"],
      ["mening abonentlarim", "getTargets"],
    ],
  ]),

  adminKeyboard: Markup.keyboard([
    "👨‍💻 Ish maydoni",
    // ["👨‍💻 Ish maydoni", "pochtaHarajatiniTekshirishScene"],
    // ["Talabnomalarni import qilish"],
  ]),

  adminWorkSpace: createInlineKeyboard([
    // [["Yangi abonent", "new_abonent"]],
    // [
    //   ["Bildirish xati kiritish", "add_notification"],
    //   ["Shaxsi tasdiqlandi", "shaxsi_tashdiqlandi_bildirish_xati"],
    // ],
    [
      ["Ogohlantish xati yuborish", "Ogohlantish xati yuborish"],
      //   ["SB generation", "sudBuyruqlariYaratish"],
    ],
    // [
    //   ["generateSavdoSanoatAriza", "generateSavdoSanoatAriza"],
    //   ["generateProkuraturaSudAriza", "generateProkuraturaSudAriza"],
    // ],
    // [["O'lim guvohnomasi ijro", "confirm_game_over"]],
    // [["Reja belgilash", "import_plan_for_inspectors"]],
    // [
    //   ["Viloyat LOGIN", "CHARGE_VILOYAT_LOGIN"],
    //   ["Tushum mfy", "mfy_income_report"],
    // ],
    // [["Abonentlar bazasini yangilash", "import_abonents_data"]],
    // [
    //   ["MFY telegram guruhi", "connect_mfy_tg_group"],
    [["Nazoratchi telegram", "user_to_inspektor"]],
    // ],
    // [["Sudga chiqorish", "get_sud_material"]],
    // [["Ommaviy sharnoma biriktirish", "ommaviy_shartnoma_biriktirish"]],
    // [["Sud buyruqlarini billingga yuklash", "upload_execution_to_billing"]],
  ]),
  yesOrNo: createInlineKeyboard([[["Xa", "yes"]], [["Yo'q", "no"]]]),
};
