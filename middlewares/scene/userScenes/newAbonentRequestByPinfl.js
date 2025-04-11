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
const { Admin } = require("../../../requires");

const enterFunc = (ctx) => {
  ctx.reply("Xonadon egasining PINFL raqamini kiriting!");
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
      if (!inspektor && !admin) {
        ctx.reply(
          "Siz ushbu amaliyotni bajarish uchun yetarli huquqga ega emassiz!"
        );
        return ctx.scene.leave();
      }
      ctx.wizard.state.inspektor = inspektor;

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
          `Ushbu abonentga allaqachon ${existAbonent.licshet} hisob raqami ochilgan`
        );
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
        return ctx.reply(
          "Sizga biriktirilgan mahallalar yo'q!",
          keyboards.cancelBtn.resize()
        );
      }
      ctx.wizard.state.mahallalarButtons = mahallalarButtons;
      const customDates = await find_one_by_pinfil_from_mvd(ctx.message.text);
      if (!customDates.success) {
        ctx.reply(customDates.message, keyboards.cancelBtn);
        return;
      }
      customDates.photo = undefined;
      ctx.wizard.state.customDates = {
        fullname: `${customDates.last_name} ${customDates.first_name} ${customDates.middle_name}`,
        pinfl: ctx.message.text,
        ...customDates,
      };
      // 61206035500020;AD8815043;
      const tozaMakonApi = createTozaMakonApi(
        inspektor.companyId || admin.companyId
      );
      ctx.wizard.state.tozaMakonApi = tozaMakonApi;
      const houses = await tozaMakonApi.get(
        "/user-service/houses/pinfl/" + ctx.message.text
      );
      await ctx.reply(
        `${customDates.last_name} ${customDates.first_name} ${customDates.middle_name}`
      );
      if (houses.status !== 200 || !houses.data.cadastr_list) {
        console.error(houses.status, houses.data);
        ctx.reply(
          houses.data.message ||
            "Kadastr tizimidan ma'lumotlarni olishda xatolik yuz berdi"
        );
        ctx.reply(
          "Mahallani tanlang",
          Markup.inlineKeyboard(mahallalarButtons)
        );
        ctx.wizard.selectStep(2);
        return;
      }
      if (houses.data.cadastr_list.length < 1 && !admin) {
        return await ctx.replyWithHTML(
          "Ushbu fuqaroga tegishli xonadon (kadastr) yo'q!\n <b>Diqqat xonadon egasi bo'lmagan shaxsga abonent ochish tavsiya etilmaydi</b>"
        );
      } else if (houses.data.cadastr_list.length < 1) {
        await ctx.replyWithHTML(
          "Ushbu fuqaroga tegishli xonadon (kadastr) yo'q!\n <b>Diqqat xonadon egasi bo'lmagan shaxsga abonent ochish tavsiya etilmaydi</b>"
        );
        ctx.reply(
          "Mahallani tanlang",
          Markup.inlineKeyboard(mahallalarButtons)
        );
        ctx.wizard.state.cadastr = "00:00:00:90:0000";
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
      console.log(error);
    }
  },
  async (ctx) => {
    try {
      const data = ctx.callbackQuery.data.split("_");
      if (data[0] !== "cadastr") {
        throw "bad request";
      }
      ctx.wizard.state.cadastr = data[1];
      await ctx.reply(
        "Mahallani tanlang",
        Markup.inlineKeyboard(ctx.wizard.state.mahallalarButtons)
      );
      await ctx.deleteMessage();
      ctx.wizard.next();
    } catch (error) {
      ctx.reply("Noto'g'ri so'rov", ctx.scene.leave());
      console.error(error);
    }
  },
  async (ctx) => {
    try {
      // mahallani o'zgaruvchiga saqlash
      const [key, mahallaId] = ctx.update.callback_query.data.split("_");
      if (key !== "mahalla") {
        throw "bad request";
      }
      const tozaMakonApi = ctx.wizard.state.tozaMakonApi;
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
      ctx.reply("Kutilgan amal bajarilmadi", keyboards.cancelBtn.resize());
      console.log(error);
    }
  },
  async (ctx) => {
    try {
      //ko'cha yoki qishloqni statega olish
      const [key, streetId] = ctx.update.callback_query.data.split("_");
      if (key !== "street") {
        throw "bad request";
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
      ctx.reply("Kutilgan amal bajarilmadi", keyboards.cancelBtn.resize());
      console.log(error);
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
      // bo'sh bo'lgan hisob raqamini olish
      const tozaMakonApi = ctx.wizard.state.tozaMakonApi;
      const generatedAccountNumber = (
        await tozaMakonApi.get(
          "/user-service/residents/account-numbers/generate",
          {
            params: {
              residentType: "INDIVIDUAL",
              mahallaId: ctx.wizard.state.mahallaId,
            },
          }
        )
      ).data;
      // passport ma'lumotlarini tizimda ro'yxatdan o'tkazish
      const passportData = (
        await tozaMakonApi.get("/user-service/citizens", {
          params: {
            passport:
              ctx.wizard.state.customDates.passport_serial +
              ctx.wizard.state.customDates.passport_number,
            pinfl: ctx.wizard.state.customDates.pinfl,
          },
        })
      ).data;
      // yangi abonent ochish
      let newAbonent = await tozaMakonApi.post("/user-service/residents", {
        accountNumber: generatedAccountNumber,
        active: true,
        citizen: passportData,
        companyId: 1144,
        contractDate: null,
        contractNumber: null,
        description:
          "Added from telegram bot " + ctx.wizard.state.inspektor.name,
        electricityAccountNumber: null,
        electricityCoato: null,
        homePhone: null,
        house: {
          cadastralNumber: ctx.wizard.state.cadastr
            ? ctx.wizard.state.cadastr
            : "00:00:00:00:00:0000",
          flatNumber: null,
          homeIndex: null,
          homeNumber: 0,
          inhabitantCnt: ctx.message.text,
          temporaryCadastralNumber: null,
          type: "HOUSE",
        },
        isCreditor: "false",
        mahallaId: ctx.wizard.state.mahallaId,
        nSaldo: 0,
        residentType: "INDIVIDUAL",
        streetId: ctx.wizard.state.street_id,
      });
      if (!newAbonent || newAbonent.status !== 201) {
        ctx.reply(
          "Abonent qo'shishda xatolik yuz berdi \n" + newAbonent.data.message
        );
        console.error(newAbonent.data);
      }
      await tozaMakonApi.patch("/user-service/residents/identified", {
        identified: true,
        residentIds: [newAbonent.data],
      });
      newAbonent = newAbonent.data;
      // natijani ma'lumotlar bazasiga saqlash, yangi abonentlar va billing abonentlarga
      await NewAbonent.create({
        abonent_name: ctx.wizard.state.customDates.fullname,
        licshet: generatedAccountNumber,
        mahalla_id: ctx.wizard.state.mahallaId,
        nazoratchi_id: ctx.wizard.state.inspektor.id,
        yashovchi_soni: ctx.message.text,
      });
      await Abonent.create({
        createdAt: new Date(),
        fio: ctx.wizard.state.customDates.fullname,
        licshet: generatedAccountNumber,
        mahallas_id: ctx.wizard.state.mahallaId,
        prescribed_cnt: Number(ctx.message.text),
        id: newAbonent,
        kadastr_number: ctx.wizard.state.cadastr,
        pinfl: ctx.wizard.state.customDates.pinfl,
        mahalla_name: (
          await Mahalla.findOne({ id: ctx.wizard.state.mahallaId })
        ).name,
        passport_number:
          ctx.wizard.state.customDates.passport_serial +
          ctx.wizard.state.customDates.passport_number,
        streets_id: ctx.wizard.state.street_id,
        shaxsi_tasdiqlandi: {
          confirm: true,
          inspector: ctx.wizard.state.inspektor,
        },
      });
      // kadastr raqamini o'chirish
      if (ctx.wizard.state.cadastr == "00:00:00:90:0000") {
        const abonentDatasResponse = await tozaMakonApi.get(
          `/user-service/residents/${newAbonent}?include=translates`
        );
        if (!abonentDatasResponse || abonentDatasResponse.status !== 200) {
          return await ctx.answerCbQuery(
            "Abonent dastlabki ma'lumotlarini oliishda xatolik"
          );
        }
        const data = abonentDatasResponse.data;
        await tozaMakonApi.put("/user-service/residents/" + newAbonent, {
          id: newAbonent,
          accountNumber: generatedAccountNumber,
          residentType: "INDIVIDUAL",
          electricityAccountNumber: data.electricityAccountNumber,
          electricityCoato: data.electricityCoato,
          companyId: data.companyId,
          streetId: data.streetId,
          mahallaId: data.mahallaId,
          contractNumber: data.contractNumber,
          contractDate: data.contractDate,
          homePhone: null,
          active: data.active,
          description: data.description,
          citizen: data.citizen,
          house: {
            ...data.house,
            cadastralNumber: "0",
          },
        });
      }
      // so'rov yuborivchiga natijani yetkazish
      if (ctx.wizard.state.inspektor.id !== 17413)
        ctx.telegram.sendMessage(
          process.env.NAZORATCHILAR_GURUPPASI,
          `${ctx.wizard.state.inspektor.name} тизимга янги абонент киритди 👍 <code>${generatedAccountNumber}</code>`,
          { parse_mode: "HTML" }
        );
      ctx.replyWithHTML(
        `Yangi abonent qo'shildi <code>${generatedAccountNumber}</code>`
      );
      ctx.scene.leave();
    } catch (error) {
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
