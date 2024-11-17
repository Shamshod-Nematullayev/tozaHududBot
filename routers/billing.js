const enterQaytaHisobAkt = require("../api/cleancity/dxsh/enterQaytaHisobAkt");
const { enterYashovchiSoniAkt } = require("../api/cleancity/dxsh");
const { upload, uploadAsBlob } = require("../middlewares/multer");
const { Mahalla } = require("../models/Mahalla");
const { Ariza } = require("../models/Ariza");
const { Counter } = require("../models/Counter");
const { IncomingDocument } = require("../models/IncomingDocument");
const cc = `https://cleancity.uz/`;
const { bot } = require("../core/bot");
const path = require("path");
const { getAbonentDXJ } = require("../api/cleancity/dxsh");
const { getAbonentDataByLicshet } = require("../api/cleancity/dxsh");
const getAbonents = require("../api/cleancity/dxsh/getAbonents");
const { kirillga } = require("../middlewares/smallFunctions/lotinKiril");
const { dvaynikUchirish } = require("../api/cleancity/dxsh/dvaynikUchirish");
const { Abonent } = require("../requires");
const { tozaMakonApi } = require("../api/tozaMakon");
const FormData = require("form-data");
const akt_pachka_id = {
  viza: "4444086",
  odam_soni: "4443772",
  dvaynik: "",
  pul_kuchirish: "4444112",
  death: "4444111",
  boshqa: "4444109",
};

const router = require("express").Router();
router.get("/next-incoming-document-number", async (req, res) => {
  const counter = await Counter.findOne({ name: "incoming_document_number" });

  if (!counter)
    return res.json({ ok: false, message: "Internal server error" });
  res.json({ ok: true, value: counter.value + 1 });
});

router.post(
  "/create-full-akt",
  uploadAsBlob.single("file"),
  async (req, res) => {
    try {
      const {
        next_inhabitant_count,
        akt_sum,
        licshet,
        ariza_id,
        document_type,
        description,
      } = req.body;
      if (isNaN(next_inhabitant_count) && isNaN(akt_sum)) {
        return res.status(400).json({
          ok: false,
          message: "yashovchi soni yoki akt summasi bo'lishi kerak",
        });
      }
      const abonent = await Abonent.findOne({ licshet });
      if (!abonent)
        return res.status(404).json({
          ok: false,
          message: "Abonent mavjud emas",
        });
      let counter = await Counter.findOne({ name: "incoming_document_number" });

      // akt faylini telegram bazaga saqlash
      const documentOnTelegram = await bot.telegram.sendDocument(
        process.env.TEST_BASE_CHANNEL_ID,
        {
          source: req.file.buffer,
          filename: req.file.originalname,
        }
      );
      await IncomingDocument.create({
        abonent: licshet,
        doc_type: document_type,
        file_id: documentOnTelegram.document.file_id,
        file_name: req.file.originalname,
        comment: description,
        date: Date.now(),
        doc_num: counter.value + 1,
      });
      await counter.updateOne({
        $set: {
          value: counter.value + 1,
          last_update: Date.now(),
        },
      });

      // akt faylini tozaMakon ga saqlash
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
      if (!isNaN(akt_sum)) {
        const calculateKSaldo = (
          await tozaMakonApi.get("/billing-service/acts/calculate-k-saldo", {
            params: {
              amount: Math.abs(akt_sum),
              residentId: abonent.id,
              actPackId: document_type
                ? akt_pachka_id[document_type]
                : akt_pachka_id.boshqa,
              actType: akt_sum < 0 ? "DEBIT" : "CREDIT",
            },
          })
        ).data;

        const date = new Date();
        const aktResponse = await tozaMakonApi.post("/billing-service/acts", {
          actPackId: document_type
            ? akt_pachka_id[document_type]
            : akt_pachka_id.boshqa,
          actType: akt_sum < 0 ? "DEBIT" : "CREDIT",
          amount: Math.abs(akt_sum),
          amountWithQQS: 0,
          amountWithoutQQS: Math.abs(akt_sum),
          description,
          endPeriod: `${date.getMonth() + 1}.${date.getFullYear()}`,
          startPeriod: `${date.getMonth() + 1}.${date.getFullYear()}`,
          fileId: fileUploadResponse.data.fileId,
          kSaldo: calculateKSaldo,
          residentId: abonent.id,
          inhabitantCount: next_inhabitant_count,
        });

        if (aktResponse.status !== 201) {
          console.error(
            "Billing tizimiga akt kiritib bo'lmadi",
            aktResponse.data
          );
          return res.json({
            ok: false,
            message: "Billing tizimiga akt kiritib bo'lmadi",
          });
        }
        const ariza = await Ariza.findByIdAndUpdate(req.body.ariza_id, {
          $set: {
            status: "akt_kiritilgan",
            akt_pachka_id: aktResponse.data.actPackId,
            akt_id: aktResponse.data.id,
            aktInfo: {
              ...aktResponse.data,
            },
            akt_date: aktResponse.data.createdAt,
          },
        });
        return res.json({
          ok: true,
          message: "Akt muvaffaqqiyatli qo'shildi",
          ariza,
        });
      }
    } catch (err) {
      console.error(err);
      res.json({ ok: false, message: "Internal server error 500" });
    }
  }
);

router.post("/create-dvaynik-akt", upload.single("file"), async (req, res) => {
  try {
    if (Number(req.body.ikkilamchi.tushum) > 0) {
      const res1 = await enterQaytaHisobAkt({
        akt_number: req.body.akt_number,
        comment: `${req.body.haqiqiy.licshet} haqiqiy hisob raqamiga pul ko'chirish`,
        amount: req.body.ikkilamchi.tushum * -1,
        filepath: path.join(__dirname, "../uploads/", req.file.filename),
        licshet: req.body.ikkilamchi.licshet,
        stack_akts_id: akt_pachka_id.pul_kuchirish,
      });
      if (!res1.success) {
        return res.json({
          ok: false,
          message: "Qayta hisob raqamiga pul ko'chirishda xatolik",
        });
      }
      const res2 = await enterQaytaHisobAkt({
        akt_number: req.body.akt_number,
        comment: `${req.body.ikkilamchi.licshet} ikkilamchidan hisob raqamiga pul ko'chirish`,
        amount: req.body.ikkilamchi.tushum,
        filepath: path.join(__dirname, "../uploads/", req.file.filename),
        licshet: req.body.haqiqiy.licshet,
        stack_akts_id: akt_pachka_id.pul_kuchirish,
      });
      if (!res2.success) {
        return res.json({
          ok: false,
          message: "Qayta hisob raqamiga pul ko'chirishda xatolik",
        });
      }
    }

    const response = await dvaynikUchirish({
      ikkilamchi_id: req.body.ikkilamchi.id,
      filepath: path.join(__dirname, "../uploads/", req.file.filename),
      stack_akts_id: akt_pachka_id.dvaynik,
    });

    if (!response.success) {
      return res.json({ ok: false, message: response.message });
    }
    if (req.body.ariza_id) {
      const ariza = await Ariza.findByIdAndUpdate(req.body.ariza_id, {
        $set: {
          status: "tasdiqlangan",
          akt_pachka_id: akt_pachka_id.dvaynik,
          akt_id: response.akt_id,
          aktInfo: { akt_number: req.body.akt_number },
          akt_date: new Date(),
        },
      });
      return res.json({
        ok: true,
        ariza,
      });
    }
    return res.json({ ok: true, message: response.message });
  } catch (err) {
    console.error(err);
    res.json({ ok: false, message: "Internal server error 500" });
  }
});

router.get(`/get-abonent-dxj-by-licshet/:licshet`, async (req, res) => {
  try {
    const { data } = await tozaMakonApi.get(
      `/billing-service/resident-balances/dhsh?accountNumber=${req.params.licshet}&page=0&size=100`
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
    if (!abonentData)
      return res.json({
        ok: false,
        message: "Abonent mavjud emas",
      });
    res.json({
      ok: true,
      abonentData: abonentData,
    });
  } catch (error) {
    res.json({ ok: false, message: "Internal server error 500" });
    console.error(error);
  }
});

const uchirilishiKerakBulganAbonentlar = [105120350731];
router.get("/get-abonents-by-mfy-id/:mfy_id", async (req, res) => {
  try {
    const abonents = await Abonent.find({ mahallas_id: req.params.mfy_id });
    const { minSaldo, maxSaldo } = req.query;
    let page = 0;
    let totalPages = 1;
    const rows = [];
    const { data } = await tozaMakonApi.get(
      `/user-service/residents?districtId=47&sort=id,DESC&page=${page}&size=400&companyId=1144&mahallaId=${req.params.mfy_id}`
    );
    rows.push(...data.content);
    totalPages = data.totalPages;
    if (totalPages > 1) {
      for (let i = 1; i < totalPages; i++) {
        const { data } = await tozaMakonApi.get(
          `/user-service/residents?districtId=47&sort=id,DESC&page=${i}&size=400&companyId=1144&mahallaId=${req.params.mfy_id}`
        );
        rows.push(...data.content);
      }
    }
    let filteredData = rows.filter((abonent) => {
      const abonentSaldo = Number(abonent.ksaldo);

      // Abonentlar ro'yxatidan chiqarilgan bo'lmaganini tekshirish
      const isNotExcluded = !uchirilishiKerakBulganAbonentlar.includes(
        Number(abonent.licshet)
      );

      // Filtrlash uchun shartlarni qo'llash
      const isAboveMinSaldo = minSaldo ? abonentSaldo > Number(minSaldo) : true;
      const isBelowMaxSaldo = maxSaldo ? abonentSaldo < Number(maxSaldo) : true;

      return isNotExcluded && isAboveMinSaldo && isBelowMaxSaldo;
    });
    filteredData = filteredData.map((abonent) => {
      let isElektrKodConfirm = false;
      const abonentMongo = abonents.find(
        (a) => a.licshet == abonent.accountNumber
      );
      if (abonentMongo)
        isElektrKodConfirm = abonentMongo.ekt_kod_tasdiqlandi?.confirm;
      return {
        ...abonent,
        isElektrKodConfirm,
        fullName: kirillga(abonent.fullName),
      };
    });
    filteredData.sort((a, b) => a.fullName.localeCompare(b.fullName));
    res.json({ ok: true, data: filteredData });
  } catch (error) {
    res.json({ ok: false, message: "Internal server error 500" });
    console.error(error);
  }
});

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
      return res.json({ ok: false, message: "Mahalla topilmadi" });
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
      return res.json({ ok: false, message: "Mahalla topilmadi" });
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
      const { minSaldo, maxSaldo, mahalla_id, mahalla_name } = req.query;
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
      await bot.telegram.sendMessage(
        process.env.NAZORATCHILAR_GURUPPASI,
        `${mahalla_name} ${minSaldo ? minSaldo + " dan yuqori" : ""} ${
          maxSaldo ? maxSaldo + " dan past" : ""
        } qarzdorligi mavjud abonentlar ro'yxati biriktirilgan aholi nazoratchisi uchun`
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

module.exports = router;
