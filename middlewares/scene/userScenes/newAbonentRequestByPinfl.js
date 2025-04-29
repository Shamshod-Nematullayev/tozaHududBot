const { Scenes, Markup } = require("telegraf");
const { find_one_by_pinfil_from_mvd } = require("../../../api/mvd-pinfil");
const isCancel = require("../../smallFunctions/isCancel");
const isRealPinflValidate = require("../../smallFunctions/isPinfl");
const { messages } = require("../../../lib/messages");
const { keyboards } = require("../../../lib/keyboards");
const { Abonent } = require("../../../models/Abonent");
const { Nazoratchi } = require("../../../models/Nazoratchi");
const { Mahalla } = require("../../../models/Mahalla");
const { NewAbonent } = require("../../../models/NewAbonents");
const { createTozaMakonApi } = require("../../../api/tozaMakon");
const { Admin, Company } = require("../../../requires");
const {
  extractBirthDateString,
} = require("../../../helpers/extractBirthDateFromPinfl");
const { EtkAbonent } = require("../../../models/EtkAbonent");

const caotoNames = [
  {
    title: "Qoradaryo TETK",
    caoto: 18214,
    region: 18,
    companyId: 1144,
  },
  {
    title: "Xatirchi TETK",
    caoto: 12251,
    region: 12,
    companyId: 1144,
  },
  {
    title: "Kattaqo'rg'on TETK",
    caoto: 18215,
    region: 18,
    companyId: 1144,
  },
  {
    title: "Paxtachi TETK",
    caoto: 18230,
    region: 18,
    companyId: 1265,
  },
];

const enterFunc = (ctx) => {
  ctx.reply("Xonadon egasining PINFL raqamini kiriting!", keyboards.cancelBtn);
};
// 0 - jshshir
// 1 - xonadon kadastr raqami
// 2 - mahalla
// 3 - ko'cha/qishloq
// 4 - yashovchilar soni
const new_abonent_request_by_pinfl_scene = new Scenes.WizardScene(
  "new_abonent_request",
  async (ctx) => {
    try {
      const admin = await Admin.findOne({ user_id: ctx.from.id });
      const inspektor = await Nazoratchi.findOne({ telegram_id: ctx.from.id });
      const company = await Company.findOne({
        id: inspektor.companyId || admin.companyId,
      });
      if (!company.canInspectorsCreateAbonent && !admin) {
        await ctx.reply(
          "Sizning tashkilotingiz nazoratchilar uchun yangi abonent yaratishga ruxsat bermagan"
        );
        ctx.scene.leave();
        return;
      }
      if (!inspektor && !admin) {
        ctx.reply(
          "Siz ushbu amaliyotni bajarish uchun yetarli huquqga ega emassiz!"
        );
        return ctx.scene.leave();
      }
      ctx.wizard.state.inspektor = inspektor;
      ctx.wizard.state.companyId = inspektor.companyId || admin.companyId;

      if (!isRealPinflValidate(ctx.message.text)) {
        ctx.replyWithPhoto(
          "https://scontent.fbhk1-4.fna.fbcdn.net/v/t39.30808-6/245114763_1689005674643325_574715679907072430_n.jpg?cstp=mx960x540&ctp=s960x540&_nc_cat=107&ccb=1-7&_nc_sid=833d8c&_nc_ohc=UuAJ9wX9hRUQ7kNvgFH6cIS&_nc_ht=scontent.fbhk1-4.fna&oh=00_AYBErDlZHdtXHYwOa1n9AicX7rhWP63Hkf8COiCnTKAlUw&oe=669E7F35",
          {
            caption: messages.enterReallyPinfl,
            reply_markup: keyboards.cancelBtn.reply_markup,
          }
        );
        return;
      }

      const existAbonent = await Abonent.findOne({
        pinfl: parseInt(ctx.message.text),
        "shaxsi_tasdiqlandi.confirm": true,
      });
      if (existAbonent) {
        ctx.reply(
          `Ushbu abonentga allaqachon ${existAbonent.licshet} hisob raqami ochilgan`,
          keyboards.mainKeyboard
        );
        ctx.scene.leave();
        return;
      }

      const mahallalarButtons = admin
        ? await keyboards.nazoratchigaBiriktirilganMahallalar(
            inspektor.companyId || admin.companyId
          )
        : await keyboards.nazoratchigaBiriktirilganMahallalar(
            inspektor.companyId,
            inspektor.id
          );

      if (!mahallalarButtons) {
        await ctx.reply(
          "Sizga biriktirilgan mahallalar yo'q!",
          keyboards.cancelBtn.resize()
        );
        return ctx.scene.leave();
      }
      ctx.wizard.state.mahallalarButtons = mahallalarButtons;

      const birthdate = extractBirthDateString(ctx.message.text);

      const citizen = (
        await createTozaMakonApi(inspektor.companyId || admin.companyId).get(
          "/user-service/citizens",
          {
            params: {
              pinfl: ctx.message.text,
              birthdate,
            },
          }
        )
      ).data;

      ctx.wizard.state.citizen = citizen;

      const tozaMakonApi = createTozaMakonApi(
        inspektor.companyId || admin.companyId
      );
      const houses = (
        await tozaMakonApi.get("/user-service/houses/pinfl/" + ctx.message.text)
      ).data;
      await ctx.reply(
        `${citizen.lastName} ${customDates.firstName} ${customDates.patronymic}`
      );
      if (!houses.cadastr_list) {
        await ctx.reply(
          houses.data.message ||
            "Kadastr tizimidan ma'lumotlarni olishda xatolik yuz berdi. Iltimos keyinroq urinib ko'ring"
        );
        ctx.reply(
          "Mahallani tanlang",
          Markup.inlineKeyboard(mahallalarButtons)
        );
        ctx.wizard.selectStep(2);
        return;
      }
      if (houses.data.cadastr_list.length < 1) {
        await ctx.replyWithHTML(
          "Ushbu fuqaroga tegishli xonadon (kadastr) yo'q!\n <b>Diqqat xonadon egasi bo'lmagan shaxsga abonent ochish tavsiya etilmaydi</b>"
        );
        await ctx.reply(
          "Mahallani tanlang",
          Markup.inlineKeyboard(mahallalarButtons)
        );
        ctx.wizard.selectStep(2);
        return;
      }
      if (houses.data.cadastr_list.length == 1) {
        ctx.reply(
          "Mahallani tanlang",
          Markup.inlineKeyboard(mahallalarButtons)
        );
        ctx.wizard.state.cadastr = houses.data.cadastr_list[0];
        ctx.wizard.selectStep(2);
        return;
      }
      const housesButtons = houses.data.cadastr_list.map((cadastr) => [
        Markup.button.callback(cadastr, "cadastr_" + cadastr),
      ]);
      ctx.reply(
        "Xonadonni kadastr raqamini tanlang",
        Markup.inlineKeyboard(housesButtons)
      );
      ctx.wizard.next();
    } catch (error) {
      ctx.reply("Kutilmagan xatolik yuz berdi", keyboards.cancelBtn.resize());
      console.error(error.message);
    }
  },
  async (ctx) => {
    try {
      const data = ctx.callbackQuery.data.split("_");
      if (data[0] !== "cadastr") {
        throw "400 bad request. Cadastr raqami tanlanmadi";
      }
      ctx.wizard.state.cadastr = data[1];
      await ctx.reply(
        "Mahallani tanlang",
        Markup.inlineKeyboard(ctx.wizard.state.mahallalarButtons)
      );
      await ctx.deleteMessage();
      ctx.wizard.next();
    } catch (error) {
      ctx.reply("Kutilmagan xatolik yuz berdi", keyboards.cancelBtn.resize());

      console.error(error.message);
    }
  },
  async (ctx) => {
    try {
      // mahallani o'zgaruvchiga saqlash
      const [key, mahallaId] = ctx.update.callback_query.data.split("_");
      if (key !== "mahalla") {
        throw "status: 400 mahalla tanlanmadi";
      }
      const tozaMakonApi = createTozaMakonApi(ctx.wizard.state.companyId);
      await ctx.deleteMessage();
      ctx.wizard.state.mahallaId = mahallaId;
      // tanlangan mahallaga doir qishloqlarni olish
      let streets = (
        await tozaMakonApi.get("/user-service/mahallas/streets", {
          params: {
            size: 1000,
            mahallaId,
          },
        })
      ).data;
      if (streets.length == 1) {
        ctx.wizard.state.street_id = streets[0].id;
        ctx.reply(
          "Yashovchi sonini tanlang yoki kiriting",
          Markup.keyboard([
            ["1", "2", "3"],
            ["4", "5", "6"],
            ["7", "8", "9"],
          ])
        );
        ctx.wizard.selectStep(4);
        return;
      }
      streets = streets.sort((a, b) => a.name.localeCompare(b.name));
      const streetButtons = streets.map((item) => [
        Markup.button.callback(item.name, "street_" + item.id),
      ]);
      ctx.reply(
        "Ko'cha yoki qishloqni tanlang",
        Markup.inlineKeyboard(streetButtons)
      );
      ctx.wizard.next();
    } catch (error) {
      ctx.reply("Kutilmagan xatolik yuz berdi", keyboards.cancelBtn.resize());
      console.error(error);
    }
  },
  async (ctx) => {
    try {
      //ko'cha yoki qishloqni statega olish
      const [key, streetId] = ctx.update.callback_query.data.split("_");
      if (key !== "street") {
        throw "400 bad request";
      }
      await ctx.deleteMessage();
      ctx.wizard.state.street_id = streetId;
      // yashovchi soni kiritish keyboardini jo'natish
      ctx.reply(
        "Yashovchi sonini tanlang yoki kiriting",
        Markup.keyboard([
          ["1", "2", "3"],
          ["4", "5", "6"],
          ["7", "8", "9"],
        ])
      );
      ctx.wizard.next();
    } catch (error) {
      ctx.reply("Kutilmagan xatolik yuz berdi", keyboards.cancelBtn.resize());
      console.error(error);
    }
  },
  async (ctx) => {
    try {
      // yashovchi sonini o'zgaruvchiga saqlash
      if (!ctx.message)
        return ctx.reply(
          "Yashovchi sonini tanlang yoki kiriting",
          Markup.keyboard([
            ["1", "2", "3"],
            ["4", "5", "6"],
            ["7", "8", "9"],
          ])
        );
      if (isNaN(ctx.message.text))
        return ctx.reply(
          "Yashovchi sonini raqamda kiritish kerak",
          keyboards.cancelBtn.resize()
        );
      if (parseInt(ctx.message.text) > 15)
        return ctx.reply(
          "Yashovchi soni 15 dan yuqori bo'lishi mumkin emas. Iltimos tekshib ko'ring"
        );

      ctx.wizard.state.inhabitant_cnt = parseInt(ctx.message.text);
      await ctx.reply("Abonent elektr kodini kiriting", keyboards.cancelBtn);
      return ctx.wizard.next();
      // yangi abonent ochish uchun ma'lumot yaratish
      const citizen = ctx.wizard.state.citizen;
      const newAbonentRequest = await NewAbonent.create({
        abonent_name: `${citizen.lastName} ${citizen.firstName} ${citizen.patronymic}`,
        nazoratchi_id: ctx.wizard.state.inspektor.id,
        senderId: ctx.from.id,
        mahallaId: ctx.wizard.state.mahallaId,
        citizen,
        streetId: ctx.wizard.state.street_id,
        cadastr: ctx.wizard.state.cadastr,
        inhabitant_cnt: Number(ctx.message.text),
        companyId: ctx.wizard.state.companyId,
      });
      ctx.scene.leave();
    } catch (error) {
      ctx.reply(
        error.response?.data?.message || "Kutilmagan xatolik yuz berdi"
      );
      console.error(error.message);
    }
  },
  async (ctx) => {
    try {
      if (isNaN(ctx.message.text)) {
        ctx.reply(
          "Error: ETK kod to'g'ri kiritilmadi",
          keyboards.cancelBtn.resize()
        );
        return;
      }
      const findedETKAbonents = await EtkAbonent.find({
        accountNumber: ctx.message.text,
        companyId: ctx.wizard.state.companyId,
      });
      if (!findedETKAbonents[0]) {
        for (let caoto of caotoNames.filter(
          (c) => c.companyId == ctx.wizard.state.companyId
        )) {
          const { data } = await axios.post(
            "https://api-e3abced5.payme.uz/api/cheque.create",
            {
              method: "cheque.create",
              params: {
                amount: 50000,
                merchant_id: "5a5dffd8687ee421a5c4b0e6",
                account: {
                  account: ctx.message.text,
                  region: caoto.region,
                  subRegion: caoto.caoto,
                },
              },
            }
          );

          if (!data.error) {
            findedETKAbonents.push({
              caotoNumber: caoto.caoto,
              accountNumber: ctx.message.text,
              customerName: data.result.cheque.account.find(
                (row) => row.name == "fio"
              ).value,
            });
          }
        }
      }
      if (!findedETKAbonents[0]) {
        ctx.reply(
          "Siz kiritgan ETK kod bo'yicha abonent ma'lumoti topilmadi. Tekshirib qaytadan kiriting",
          keyboards.cancelBtn.resize()
        );
        return;
      }
      if (findedETKAbonents.length > 1) {
        const buttons = [];
        findedETKAbonents.forEach((abonent) => {
          const caoto = caotoNames.find((c) => c.caoto == abonent.caotoNumber);
          buttons.push(
            Markup.button.callback(caoto.title, abonent.caotoNumber)
          );
        });
        ctx.reply("Hududni tanlang", Markup.inlineKeyboard(buttons));
        ctx.wizard.state.findedETKAbonents = findedETKAbonents;
        ctx.wizard.state.ETK = ctx.message.text;
        ctx.wizard.selectStep(3);
        return;
      }
      const etk_abonent = findedETKAbonents[0];
      if (!etk_abonent) {
        ctx.reply("Bunday elektr kodi topilmadi");
        return;
      }
      await ctx.replyWithHTML(
        `Abonent: <code>${etk_abonent.customerName}</code> \nUshbu abonentga shu hisob raqamni rostdan ham kiritaymi?`,
        createInlineKeyboard([
          [
            ["Xa 👌", "yes"],
            ["Yo'q 🙅‍♂️", "no"],
          ],
        ])
      );
      ctx.wizard.state.ETK = ctx.message.text;
      ctx.wizard.state.etk_abonent = etk_abonent;
      ctx.wizard.next();
    } catch (error) {
      ctx.reply("Error: " + error.message);
      console.error(error);
    }
  }
);

new_abonent_request_by_pinfl_scene.on("text", (ctx, next) => {
  if (isCancel(ctx.message.text)) {
    ctx.reply("Amaliyot bekor qilindi", keyboards.mainKeyboard);
    return ctx.scene.leave();
  }
  next();
});
new_abonent_request_by_pinfl_scene.leave((ctx) =>
  ctx.reply("Yakunlandi", keyboards.mainKeyboard.resize())
);
new_abonent_request_by_pinfl_scene.enter(enterFunc);

module.exports = { new_abonent_request_by_pinfl_scene };
