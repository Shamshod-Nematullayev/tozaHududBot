import { WizardScene } from "telegraf/scenes";
import { Mahalla } from "@models/Mahalla";
import { Admin } from "@models/Admin";
import { Company } from "@models/Company";
import { createTozaMakonApi } from "@api/tozaMakon";
import { Markup } from "telegraf";
import { createInlineKeyboard, keyboards } from "@lib/keyboards";
import isCancel from "../../../middlewares/smallFunctions/isCancel";
// mini map
// 0 entry
// 1 picking mahalla
// 2 picking street
// 3 picking geozone
// 4 proccess and final answer

export const abonentlarniGeozonagaBiriktirish = new WizardScene(
  "abonentlarniGeozonagaBiriktirish",
  async (ctx) => {
    try {
      const admin = await Admin.findOne({ user_id: ctx.from.id }).lean();
      const mahallalar = await Mahalla.find({
        companyId: admin.companyId,
      }).lean();

      ctx.wizard.state.companyId = admin.companyId;
      ctx.wizard.state.mahallalar = mahallalar;
      ctx.wizard.state.admin = admin;

      await ctx.reply(
        "Mahallani tanlang",
        Markup.inlineKeyboard(
          mahallalar.map((item) => {
            return [Markup.button.callback(item.name, `mahalla_${item.id}`)];
          })
        )
      );
      ctx.wizard.next();
    } catch (error) {
      console.error(
        error.message,
        " abonentlarniGeozonagaBiriktirish scene mahalla"
      );
      ctx.reply("Xatolik kuzatildi", keyboards.cancelBtn);
    }
  },
  async (ctx) => {
    try {
      ctx.deleteMessage();
      const mahalla = ctx.wizard.state.mahallalar.find(
        (m) => m.id == ctx.callbackQuery.data.split("_")[1]
      );
      ctx.wizard.state.mahalla = mahalla;

      const tozaMakonApi = createTozaMakonApi(ctx.wizard.state.companyId);
      let streets = (
        await tozaMakonApi.get("/user-service/mahallas/streets", {
          params: {
            size: 1000,
            mahallaId: mahalla.id,
          },
        })
      ).data;
      streets = streets.sort((a, b) => a.name.localeCompare(b.name));
      streets = streets.filter(
        (s) => !mahalla.geoZoneBiriktirilganKochalar?.includes(s.id)
      );
      ctx.wizard.state.streets = streets;
      const streetButtons = streets.map((item) => [
        Markup.button.callback(item.name, item.id),
      ]);
      streetButtons.push([Markup.button.callback("Tugatish", "done")]);
      await ctx.reply(
        "Ko'cha yoki qishloqni tanlang",
        Markup.inlineKeyboard(streetButtons)
      );
      ctx.wizard.state.pickedStreets = [];
      ctx.wizard.next();
    } catch (error) {
      console.error(error);
      ctx.reply("Xatolik kuzatildi", keyboards.cancelBtn);
    }
  },
  async (ctx) => {
    try {
      if (ctx.callbackQuery?.data == "done") {
        const company = await Company.findOne({
          id: ctx.wizard.state.companyId,
        });
        const tozaMakonApi = createTozaMakonApi(
          ctx.wizard.state.companyId,
          "gps"
        );
        const subMahallas = (
          await tozaMakonApi.get("/user-service/sub-mahallas", {
            params: {
              districtId: company.districtId,
              mahallaId: ctx.wizard.state.mahalla.id,
              page: 0,
              size: 15,
            },
          })
        ).data.content;
        ctx.wizard.state.subMahallas = subMahallas.map((s) => ({
          id: s.id,
          name: s.name,
        }));
        ctx.deleteMessage();
        await ctx.reply(
          "Geozonani tanlang",

          Markup.inlineKeyboard(
            subMahallas.map((item) => [
              Markup.button.callback(item.name, item.id),
            ])
          )
        );
        ctx.wizard.next();
        return;
      }
      const street = ctx.wizard.state.streets.find(
        (s) => s.id == ctx.callbackQuery.data
      );
      ctx.wizard.state.pickedStreets.push(street);
      const buttons = ctx.wizard.state.streets
        .filter(
          (s) =>
            !ctx.wizard.state.pickedStreets.includes(s) &&
            !ctx.wizard.state.mahalla.geoZoneBiriktirilganKochalar?.includes(
              s.id
            )
        )
        .map((item) => [Markup.button.callback(item.name, item.id)]);

      buttons.push([Markup.button.callback("Tugatish", "done")]);
      await ctx.deleteMessage();
      await ctx.reply(
        "Ko'cha yoki qishloqni tanlang",
        Markup.inlineKeyboard(buttons)
      );
    } catch (error) {
      console.error(
        error.message,
        " abonentlarniGeozonagaBiriktirish scene street"
      );
      ctx.reply("Xatolik kuzatildi", keyboards.cancelBtn);
    }
  },
  async (ctx) => {
    try {
      const subMahalla = ctx.wizard.state.subMahallas.find(
        (s) => s.id == ctx.callbackQuery.data
      );

      const residentIds = [];

      const tozaMakonApi = createTozaMakonApi(
        ctx.wizard.state.companyId,
        "gps"
      );
      for (const street of ctx.wizard.state.pickedStreets) {
        const residents = (
          await tozaMakonApi.get("/user-service/residents", {
            params: {
              streetId: street.id,
              mahallaBindStatus: true,
              mahallaId: ctx.wizard.state.mahalla.id,
              size: 300,
            },
          })
        ).data;
        residents.content.forEach((r) => {
          if (!r.mahallaBindStatus) residentIds.push(r.id);
        });
        const totalPages = residents.totalPages;
        for (let i = 1; i < totalPages; i++) {
          const residents = (
            await tozaMakonApi.get("/user-service/residents", {
              params: {
                streetId: street.id,
                mahallaBindStatus: true,
                mahallaId: ctx.wizard.state.mahalla.id,
                size: 300,
                page: i,
              },
            })
          ).data;
          residents.content.forEach((r) => {
            if (!r.mahallaBindStatus) residentIds.push(r.id);
          });
        }
      }

      await tozaMakonApi.post("/user-service/sub-mahalla-residents", {
        subMahallaId: subMahalla.id,
        residentIds: residentIds,
      });
      const mfy = await Mahalla.findOneAndUpdate(
        { id: ctx.wizard.state.mahalla.id },
        {
          $push: {
            geoZoneBiriktirilganKochalar: {
              $each: ctx.wizard.state.pickedStreets.map((s) => s.id),
            },
          },
        },
        { new: true }
      );
      ctx.wizard.state.mahalla = mfy;
      await ctx.deleteMessage();
      await ctx.reply("Geozona biriktirildi", keyboards.adminKeyboard.resize());
      const buttons = ctx.wizard.state.streets
        .filter((s) => !ctx.wizard.state.pickedStreets.includes(s))
        .map((item) => [Markup.button.callback(item.name, item.id)]);

      ctx.wizard.state.pickedStreets = [];
      buttons.push([Markup.button.callback("Tugatish", "done")]);
      ctx.wizard.selectStep(2);
      await ctx.reply(
        "Ko'cha yoki qishloqni tanlang",
        Markup.inlineKeyboard(buttons)
      );
    } catch (error) {
      console.error(error);
      ctx.reply(
        "Xatolik kuzatildi " + error.response?.data?.message,
        keyboards.cancelBtn
      );
    }
  }
);

abonentlarniGeozonagaBiriktirish.leave(async (ctx) => {
  await ctx.reply("Jarayon yakullandi", keyboards.adminKeyboard.resize());
});

abonentlarniGeozonagaBiriktirish.on("text", async (ctx, next) => {
  if (isCancel(ctx.message.text)) {
    await ctx.reply("Bekor qilindi", keyboards.adminKeyboard.resize());
    return ctx.scene.leave();
  }
  next();
});
