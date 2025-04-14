const { createTozaMakonApi } = require("../api/tozaMakon");
const { Composer } = require("telegraf");
const { bot } = require("../core/bot");
const { CustomDataRequest } = require("../models/CustomDataRequest");
const { Nazoratchi } = require("../models/Nazoratchi");
const { Company } = require("../models/Company");
const { Abonent } = require("../models/Abonent");
const { Admin } = require("../requires");
const FormData = require("form-data");
const { find_one_by_pinfil_from_mvd } = require("../api/mvd-pinfil");

const composer = new Composer();

function base64ToBlob(base64, mimeType = "") {
  const byteCharacters = atob(base64);
  const byteArrays = [];

  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);
    const byteNumbers = new Array(slice.length)
      .fill()
      .map((_, i) => slice.charCodeAt(i));
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  return new Blob(byteArrays, { type: mimeType });
}
function subtractTenYears(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);

  const date = new Date(year, month - 1, day); // JSda oy 0-based
  date.setFullYear(date.getFullYear() - 10); // 10 yil orqaga

  // Formatni tiklaymiz: YYYY-MM-DD
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}`;
}

composer.action(/shaxsitasdiqlandi_/g, async (ctx) => {
  try {
    // kerakli ma'lumotlarni tayyorlash
    const [_, _id, tasdiqlandi] = ctx.callbackQuery.data.split("_");
    const req = await CustomDataRequest.findById(_id);
    if (!req) {
      await ctx.answerCbQuery("Shaxsini tasdiqlash so'rovi bazada topilmadi");
      return await ctx.deleteMessage();
    }
    const inspector = await Nazoratchi.findById(req.inspector_id);
    const admin = await Admin.findOne({
      user_id: ctx.from.id,
      companyId: req.companyId,
    });
    if (!admin)
      return await ctx.answerCbQuery(
        "Amaliyotni bajarish uchn yetarli huquqga ega emassiz"
      );
    const company = await Company.findOne({ id: req.companyId || 1144 });
    if (!company.active) {
      return await ctx.answerCbQuery(
        "Dastur faoliyati vaqtincha cheklangan. \nIltimos, xizmatlardan foydalanishni davom ettirish uchun to‘lovni amalga oshiring."
      );
    }

    // Tasdiqlangan bo'lsa
    if (JSON.parse(tasdiqlandi)) {
      const abonent = await Abonent.findOne({ licshet: req.licshet });
      const [yil, oy, kun] = req.data.birth_date.split("-");
      if (
        abonent.shaxsi_tasdiqlandi &&
        abonent.shaxsi_tasdiqlandi.confirm &&
        !req.reUpdating
      ) {
        return ctx.answerCbQuery("Bu abonent ma'lumoti kiritilib bo'lingan");
      }
      //   billingga yangilov so'rovini yuborish
      const tozaMakonApi = createTozaMakonApi(req.companyId);
      let pasportData;
      try {
        pasportData = await tozaMakonApi.get("/user-service/citizens", {
          params: {
            passport: req.data.passport_serial + req.data.passport_number,
            pinfl: req.data.pinfl,
          },
        });
        if (!pasportData.data.photo) {
          const formData = new FormData();
          const customDates = await find_one_by_pinfil_from_mvd(req.data.pinfl);
          if (!customDates.success) {
            return ctx.answerCbQuery(customDates.message);
          }
          // MIME turini ajratamiz
          const mimeMatch = customDates.photo.match(/^data:(.+);base64,(.*)$/);
          const mimeType = mimeMatch[1];
          const base64Data = mimeMatch[2];
          // Blobga o‘girib, FormData ichiga qo‘shamiz
          const blob = base64ToBlob(base64Data, mimeType);

          formData.append("file", blob, "image.jpg");
          const bucket = (
            await tozaMakonApi.post("/file-service/buckets/upload", formData, {
              params: {
                folderType: "RESIDENT_IMAGE",
              },
              headers: {
                "Content-Type": "multipart/form-data",
              },
            })
          ).data;
          pasportData = {
            birthDate: req.data.birth_date,
            email: null,
            firstName: req.data.first_name,
            foreignCitizen: false,
            id: abonent.id,
            inn: null,
            lastName: req.data.last_name,
            passport: req.data.passport_serial + req.data.passport_number,
            passportExpireDate: req.data.details.doc_end_date,
            passportGivenDate: subtractTenYears(req.data.details.doc_end_date),
            passportIssuer: req.data.details.division,
            patronymic: req.data.middle_name,
            photo: bucket.fileId,
            pnfl: req.data.pinfl,
          };
          return console.log(pasportData);
        }
      } catch (error) {
        ctx.answerCbQuery(error.response.data.message);
      }
      const abonentDatasResponse = await tozaMakonApi.get(
        `/user-service/residents/${abonent.id}?include=translates`
      );
      if (!abonentDatasResponse || abonentDatasResponse.status !== 200) {
        return await ctx.answerCbQuery(
          "Abonent dastlabki ma'lumotlarini oliishda xatolik"
        );
      }
      const data = abonentDatasResponse.data;
      const updateResponse = await tozaMakonApi.put(
        "/user-service/residents/" + abonent.id,
        {
          id: abonent.id,
          accountNumber: abonent.licshet,
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
          description: `${inspector.id} ${inspector.name} ma'lumotiga asosan shaxsi tasdiqlandi o'zgartirildi.`,
          citizen: {
            ...pasportData.data,
            phone: data.citizen.phone,
          },
          house: {
            ...data.house,
            cadastralNumber: data.house.cadastralNumber
              ? data.house.cadastralNumber
              : "00:00:00:00:00:0000:0000",
          },
        }
      );
      if (!updateResponse || updateResponse.status !== 200) {
        return await ctx.answerCbQuery("Ma'lumotlarni yangilashda xatolik");
      }
      await tozaMakonApi.patch("/user-service/residents/identified", {
        identified: true,
        residentIds: [abonent.id],
      });

      //   mongodb ma'lumotlar bazada yangilanish
      await abonent.updateOne({
        $set: {
          brith_date: `${kun}.${oy}.${yil}`,
          fio: `${req.data.last_name} ${req.data.first_name} ${req.data.middle_name}`,
          description: `${inspector.id} ${inspector.name} ma'lumotiga asosan o'zgartirildi.`,
          photo: req.data.photo,
          passport_number: `${req.data.passport_serial}${req.data.passport_number}`,
          passport_expire_date: req.data.details.doc_end_date
            ? `${req.data.details.doc_end_date.split("-")[2]}.${
                req.data.details.doc_end_date.split("-")[1]
              }.${req.data.details.doc_end_date.split("-")[0]}`
            : undefined,
          pinfl: req.data.pinfl,
          shaxsi_tasdiqlandi: {
            confirm: true,
            inspector: { name: inspector.name, _id: inspector._id },
            updated_at: new Date(),
          },
        },
        $push: {
          shaxsi_tasdiqlandi_history: {
            ...abonent.shaxsi_tasdiqlandi,
            fullName: abonent.fio,
            pinfl: abonent.pinfl,
          },
        },
      });
      //   tizimga kiritgan nazoratchiga baho berish
      await inspector.updateOne({
        $set: {
          shaxs_tasdiqlash_ball: Number(inspector.shaxs_tasdiqlash_ball) + 1,
        },
      });
      //   requestni o'chirib yuborish
      await req.deleteOne();
      //   telegram kanaldagi postni yangilash
      await ctx.telegram.editMessageCaption(
        company.CHANNEL_ID_SHAXSI_TASDIQLANDI,
        ctx.update.callback_query.message.message_id,
        0,
        `KOD: ${req.licshet}\nFIO: ${req.data.last_name} ${req.data.first_name} ${req.data.middle_name} ${req.data.birth_date}\nInspector: <a href="https://t.me/${req.user.username}">${inspector.name}</a>\nTasdiqladi: <a href="https://t.me/${ctx.from.username}">${ctx.from.first_name}</a>`,
        { parse_mode: "HTML" }
      );
      await ctx.deleteMessage();
      //   tizimga kiritgan nazoratchiga javob yo'llash
      await ctx.telegram.sendMessage(
        req.user.id,
        `Tabriklaymiz 🥳🥳 Siz yuborgan pasport ma'lumot qabul qilindi. <b>${
          req.licshet
        }</b> \nPasport: ${req.data.last_name} ${req.data.first_name} ${
          req.data.middle_name
        } ${
          req.data.birth_date
        }\n 1 ballni qo'lga kiritdingiz. \n Jami to'plagan ballaringiz: <b>${
          Number(inspector.shaxs_tasdiqlash_ball) + 1
        }</b>`,
        { parse_mode: "HTML" }
      );
      //   adminga amaliyot tugagani haqida xabar yuborish status: 200
    } else {
      // kiritilgan ma'lumot noto'g'ri deb topilganida
      // so'rovni o'chirib yuborish
      await CustomDataRequest.findByIdAndDelete(_id);
      // nazoratchiga xabar yuborish
      await ctx.telegram.sendMessage(
        req.user.id,
        `Siz yuborgan pasport ma'lumot bekor qilindi. <b>${req.licshet}</b> \nPasport: ${req.data.last_name} ${req.data.first_name} ${req.data.middle_name} ${req.data.birth_date}`,
        { parse_mode: "HTML" }
      );
      // telegram kanaldagi xabarni o'zgartirish
      await ctx.editMessageCaption(
        `KOD: ${req.licshet}\nFIO: ${req.data.last_name} ${req.data.first_name} ${req.data.middle_name} ${req.data.birth_date}\nInspector: <a href="https://t.me/${req.user.username}">${inspector.name}</a>\nBekor qilindi: <a href="https://t.me/${ctx.from.username}">${ctx.from.first_name}</a>`,
        { parse_mode: "HTML" }
      );

      await ctx.deleteMessage();
    }
  } catch (error) {
    try {
      await ctx.answerCbQuery("Xatolik kuzatildi");
    } catch (error) {
      console.error(error);
    }
    console.error(error);
  }
});

bot.use(composer);
