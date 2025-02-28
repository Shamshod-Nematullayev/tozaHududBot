const { uploadAsBlob } = require("../middlewares/multer");
const { Mahalla } = require("../models/Mahalla");
const { Counter } = require("../models/Counter");
const { bot } = require("../core/bot");
const { Abonent } = require("../requires");
const { tozaMakonApi } = require("../api/tozaMakon");
const FormData = require("form-data");
const { kirillga } = require("../middlewares/smallFunctions/lotinKiril");
const {
  downloadFileFromBilling,
  getAbonentDHJByAbonentId,
  getAbonentActs,
  createFullAct,
  createDublicateAct,
  getAbonentsByMfyId,
} = require("./controllers/billing.controller");
const { akt_pachka_id } = require("../constants");

const router = require("express").Router();
router.get("/next-incoming-document-number", async (req, res) => {
  const counter = await Counter.findOne({ name: "incoming_document_number" });

  if (!counter)
    return res.json({ ok: false, message: "Internal server error" });
  res.json({ ok: true, value: counter.value + 1 });
});

router.get("/get-file/", downloadFileFromBilling);

router.post("/create-full-akt", uploadAsBlob.single("file"), createFullAct);

router.post(
  "/create-dvaynik-akt-by-ariza",
  uploadAsBlob.single("file"),
  createDublicateAct
);

router.post(
  "/create-dvaynik-akt",
  uploadAsBlob.single("file"),
  async (req, res) => {
    try {
      const { realAccountNumber, fakeAccountNumber, fakeAccountIncomeAmount } =
        req.body;
      const date = new Date();
      const abonentReal = await Abonent.findOne({ licshet: realAccountNumber });
      const abonentFake = await Abonent.findOne({ licshet: fakeAccountNumber });
      const formData = new FormData();
      formData.append("file", req.file.buffer, req.file.originalname);
      const fileUploadResponse = await tozaMakonApi.post(
        "/file-service/buckets/upload?folderType=SPECIFIC_ACT",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      if (fakeAccountIncomeAmount > 0) {
        const calculateKSaldo = (
          await tozaMakonApi.get("/billing-service/acts/calculate-k-saldo", {
            params: {
              amount: Math.abs(fakeAccountIncomeAmount),
              residentId: abonentReal.id,
              actPackId: akt_pachka_id.pul_kuchirish,
              actType: "CREDIT",
            },
          })
        ).data;
        (
          await tozaMakonApi.post("/billing-service/acts", {
            actPackId: akt_pachka_id.pul_kuchirish,
            actType: "CREDIT",
            amount: Math.abs(fakeAccountIncomeAmount),
            amountWithQQS: Math.abs(fakeAccountIncomeAmount),
            amountWithoutQQS: 0,
            description: `${fakeAccountNumber} ikkilamchi hisob raqamidan pul ko'chirish`,
            endPeriod: `${date.getMonth() + 1}.${date.getFullYear()}`,
            startPeriod: `${date.getMonth() + 1}.${date.getFullYear()}`,
            fileId:
              fileUploadResponse.data.fileName +
              "*" +
              fileUploadResponse.data.fileId,
            kSaldo: calculateKSaldo,
            residentId: abonentReal.id,
          })
        ).data;
        // monay transfer from fake account
        const calculateKSaldo2 = (
          await tozaMakonApi.get("/billing-service/acts/calculate-k-saldo", {
            params: {
              amount: fakeAccountIncomeAmount,
              residentId: abonentFake.id,
              actPackId: akt_pachka_id.pul_kuchirish,
              actType: "DEBIT",
            },
          })
        ).data;
        (
          await tozaMakonApi.post("/billing-service/acts", {
            actPackId: akt_pachka_id.pul_kuchirish,
            actType: "DEBIT",
            amount: fakeAccountIncomeAmount,
            amountWithQQS: fakeAccountIncomeAmount,
            amountWithoutQQS: 0,
            description: `${abonentReal.licshet} haqiqiy hisob raqamiga pul ko'chirish`,
            endPeriod: `${date.getMonth() + 1}.${date.getFullYear()}`,
            startPeriod: `${date.getMonth() + 1}.${date.getFullYear()}`,
            fileId:
              fileUploadResponse.data.fileName +
              "*" +
              fileUploadResponse.data.fileId,
            kSaldo: calculateKSaldo2,
            residentId: abonentFake.id,
          })
        ).data;
      }
      // ikkilamchi hisob raqamini o'chirish kodlari
      const calculateAmount = (
        await tozaMakonApi.get("/billing-service/acts/calculate-amount", {
          params: {
            actPackId: akt_pachka_id.dvaynik,
            residentId: abonentFake.id,
            inhabitantCount: 0,
            kSaldo: 0,
          },
        })
      ).data;
      const dvaynikAkt = (
        await tozaMakonApi.post("/billing-service/acts", {
          actPackId: akt_pachka_id.dvaynik,
          actType: "CREDIT",
          amount:
            Number(calculateAmount.amount) + Number(fakeAccountIncomeAmount),
          amountWithQQS:
            Number(calculateAmount.amount) + Number(fakeAccountIncomeAmount),
          amountWithoutQQS: 0,
          description: `ikkilamchi hisob raqamini o'chirish`,
          endPeriod: `${date.getMonth() + 1}.${date.getFullYear()}`,
          startPeriod: `${date.getMonth() + 1}.${date.getFullYear()}`,
          fileId:
            fileUploadResponse.data.fileName +
            "*" +
            fileUploadResponse.data.fileId,
          kSaldo: 0,
          residentId: abonentFake.id,
          inhabitantCount: 0,
        })
      ).data;

      return res.json({
        ok: true,
        message: "muvaffaqqiyatli akt qilindi",
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ ok: false, message: "Internal server error 500" });
    }
  }
);

router.get(`/get-abonent-dxj-by-id/:abonent_id`, getAbonentDHJByAbonentId);
router.get(`/get-abonent-dxj-by-licshet/:licshet`, async (req, res) => {
  try {
    const abonent = await Abonent.findOne({ licshet: req.params.licshet });
    const { data } = await tozaMakonApi.get(
      `/billing-service/resident-balances/dhsh?residentId=${abonent.id}&page=0&size=100`
    );

    res.json({
      ok: true,
      message: data.msg,
      rows: data.content,
    });
  } catch (error) {
    res.json({ ok: false, message: "Internal server error 500" });
    console.error(error);
  }
});
router.get("/get-abonent-data-by-licshet/:licshet", async (req, res) => {
  try {
    // const abonentData = await getAbonentDataByLicshet({
    //   licshet: req.params.licshet,
    // });
    const abonentData = await Abonent.findOne({ licshet: req.params.licshet });
    if (!abonentData) {
      return res.status(404).json({
        ok: false,
        message: "Abonent mongodbda mavjud emas",
      });
    }

    const response = await tozaMakonApi.get(
      "/user-service/residents/" + abonentData.id
    );
    if (response.status !== 200) {
      return response.json({
        ok: false,
        message: "Abonent dastlabki ma'lumotlarini oliishda xatolik",
      });
    }
    res.json({
      ok: true,
      abonentData: response.data,
    });
  } catch (error) {
    res.json({ ok: false, message: "Internal server error 500" });
    console.error(error);
  }
});

router.get("/get-abonents-by-mfy-id/:mfy_id", getAbonentsByMfyId);

router.get("/get-all-active-mfy", async (req, res) => {
  try {
    const data = await Mahalla.find({ reja: { $gt: 0 } });
    const mahallalar = data.map((mfy) => {
      return { id: mfy.id, name: mfy.name, printed: mfy.abarotka_berildi };
    });
    mahallalar.sort((a, b) => a.name.localeCompare(b.name));
    mahallalar.sort((a, b) => parseInt(a.printed) - parseInt(b.printed));
    res.json({ ok: true, data: mahallalar });
  } catch (error) {
    res.json({ ok: false, message: "Internal server error 500" });
    console.error(error);
  }
});

router.put("/abarotka-berildi/:mfy_id", async (req, res) => {
  try {
    console.log(req.params.mfy_id);
    const result = await Mahalla.updateOne(
      { id: req.params.mfy_id },
      { $set: { abarotka_berildi: true } }
    );
    if (!result.modifiedCount) {
      return res.status(404).json({ ok: false, message: "Mahalla topilmadi" });
    }
    res.json({ ok: true, message: "Updated" });
  } catch (error) {
    res.json({ ok: false, message: "Internal server error 500" });
    console.error(error);
  }
});
router.put("/abarotka-berilmadi/:mfy_id", async (req, res) => {
  try {
    const result = await Mahalla.updateOne(
      { id: req.params.mfy_id },
      { $set: { abarotka_berildi: false } }
    );
    if (!result.modifiedCount) {
      return res.status(404).json({ ok: false, message: "Mahalla topilmadi" });
    }
    res.json({ ok: true, message: "Updated" });
  } catch (error) {
    res.json({ ok: false, message: "Internal server error 500" });
    console.error(error);
  }
});
router.put("/barchasiga-abarotka-berilmadi", async (req, res) => {
  try {
    await Mahalla.updateMany(
      { reja: { $gt: 0 } },
      { $set: { abarotka_berildi: false } }
    );
    res.json({ ok: true, message: "Updated" });
  } catch (error) {
    res.json({ ok: false, message: "Internal server error 500" });
    console.error(error);
  }
});
router.post(
  "/send-abonents-list-to-telegram/",
  uploadAsBlob.any(),
  async (req, res) => {
    try {
      const { minSaldo, maxSaldo, onlyNotIdentited, mahalla_name } = req.query;
      const files = req.files;

      if (!files || files.length === 0) {
        return res.status(400).send("Hech qanday fayl yuklanmadi!");
      }

      // Yuklangan fayllarni Telegram media group formatiga o‘tkazish

      const mediaGroup = files.map((file) => ({
        type: "photo",
        media: { source: file.buffer }, // Faylni `buffer` orqali yuboramiz
      }));

      // Media groupni Telegram guruhiga yuborish
      await bot.telegram.sendMediaGroup(
        process.env.NAZORATCHILAR_GURUPPASI,
        mediaGroup
      );
      let caption = `${mahalla_name} ${
        minSaldo ? minSaldo + " dan yuqori" : ""
      } ${
        maxSaldo ? maxSaldo + " dan past" : ""
      } qarzdorligi mavjud abonentlar ro'yxati biriktirilgan aholi nazoratchisi uchun`;
      if (onlyNotIdentited)
        caption = `${mahalla_name} mahallasi shaxsi tasdiqlanmagan abonentlar ro'yxati, aholi nazoratchisi uchun`;
      await bot.telegram.sendMessage(
        process.env.NAZORATCHILAR_GURUPPASI,
        caption
      );

      res.status(200).send("Rasmlar muvaffaqiyatli yuborildi!");
    } catch (error) {
      console.error("Xatolik yuz berdi:", error.message);
      res.status(500).json({
        ok: false,
        message: "Internal server error 500",
      });
    }
  }
);

router.post(
  "/send-abonents-list-to-telegram-as-pdf",
  uploadAsBlob.single("file"),
  (req, res) => {
    try {
      // TODO: PDF yaratish
      bot.telegram.sendDocument(process.env.ME, { source: req.file.buffer });
    } catch (error) {
      console.error("Xatolik yuz berdi:", error.message);
      res.status(500).json({
        ok: false,
        message: "Internal server error 500",
      });
    }
  }
);

router.get("/get-mfy-by-id/:mfy_id", async (req, res) => {
  try {
    const mahalla = await Mahalla.findOne({ id: req.params.mfy_id });
    if (!mahalla) return res.json({ ok: false, message: "MFY not found" });

    res.json({ ok: true, data: mahalla });
  } catch (error) {
    res.json({ ok: false, message: "Internal server error 500" });
    console.error(error);
  }
});

router.get("/get-abonent-acts/:abonentId", getAbonentActs);

module.exports = router;
