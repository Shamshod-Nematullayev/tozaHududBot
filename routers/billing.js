const enterQaytaHisobAkt = require("../api/cleancity/dxsh/enterQaytaHisobAkt");
const { enterYashovchiSoniAkt } = require("../api/cleancity/dxsh");
const { upload } = require("../middlewares/multer");
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
const akt_pachka_id = {
  viza: "4442831",
  odam_soni: "4442830",
  dvaynik: "4442829",
  pul_kuchirish: "4442828",
  death: "4442827",
  boshqa: "4442832",
};

const router = require("express").Router();
router.get("/next-incoming-document-number", async (req, res) => {
  const counter = await Counter.findOne({ name: "incoming_document_number" });

  if (!counter)
    return res.json({ ok: false, message: "Internal server error" });
  res.json({ ok: true, value: counter.value + 1 });
});

router.post("/create-full-akt", upload.single("file"), async (req, res) => {
  try {
    let counter = {};
    if (req.body.autoAktNumber === "true") {
      counter = await Counter.findOne({ name: "incoming_document_number" });

      const documentOnTelegram = await bot.telegram.sendDocument(
        process.env.TEST_BASE_CHANNEL_ID,
        {
          source: path.join(__dirname, "../uploads/", req.file.filename),
        }
      );
      const document = await IncomingDocument.create({
        abonent: req.body.licshet,
        doc_type: req.body.doc_type,
        inspector: req.body.inspector,
        file_id: documentOnTelegram.document.file_id,
        file_name: req.file.filename + ".pdf",
        comment: req.body.comment,
        date: Date.now(),
        doc_num: counter.value + 1,
      });
      await counter.updateOne({
        $set: {
          value: counter.value + 1,
          last_update: Date.now(),
        },
      });
    } else {
      counter.value = Number(req.body.akt_number) - 1;
    }

    let yashovchi = { success: true };

    if (req.body.yashovchilarUzgartirish == "true") {
      yashovchi = await enterYashovchiSoniAkt({
        akt_number: counter.value + 1,
        comment: req.body.comment,
        filepath: path.join(__dirname, "../uploads/", req.file.filename),
        licshet: req.body.licshet,
        prescribed_cnt: req.body.prescribed_cnt,
        stack_prescribed_akts_id: "8778", // yashovchi soni akt pachkasi har oy o'zgartiriladi
      });
    }
    let qaytahisob = { success: true };
    if (req.body.qaytaHisobBuladi == "true") {
      qaytahisob = await enterQaytaHisobAkt({
        akt_number: counter.value + 1,
        comment: req.body.comment,
        amount: req.body.amount,
        filepath: path.join(__dirname, "../uploads/", req.file.filename),
        licshet: req.body.licshet,
        nds_summ: req.body.nds_summ ? req.body.nds_summ : 0,
        stack_akts_id: req.body.ariza_id
          ? akt_pachka_id[req.body.ariza.document_type]
          : akt_pachka_id.boshqa,
      });
      if (!qaytahisob.success) {
        return res.json({
          ok: false,
          ...qaytahisob,
          message: qaytahisob.msg,
        });
      }
    }
    if (req.body.ariza_id && qaytahisob.success && yashovchi.success) {
      const ariza = await Ariza.findByIdAndUpdate(req.body.ariza_id, {
        $set: {
          status: "tasdiqlangan",
          akt_pachka_id: req.body.ariza_id
            ? akt_pachka_id[req.body.ariza.document_type]
            : akt_pachka_id.boshqa,
          akt_id: qaytahisob.akt_id,
          aktInfo: {
            akt_number: counter.value + 1,
            comment: req.body.comment,
            amount: req.body.amount,
            licshet: req.body.licshet,
            nds_summ: req.body.nds_summ,
          },
          akt_date: new Date(),
        },
      });
      return res.json({
        ok: qaytahisob.success && yashovchi.success ? true : false,
        qaytahisob,
        yashovchi,
        ariza,
      });
    }

    res.json({
      ok: qaytahisob.success && yashovchi.success ? true : false,
      qaytahisob,
      yashovchi,
    });
  } catch (err) {
    console.error(err);
  }
});

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
    const data = await getAbonentDXJ({ licshet: req.params.licshet });
    const abonentData = await getAbonentDataByLicshet({
      licshet: req.params.licshet,
    });

    res.json({
      ok: data.success,
      message: data.msg,
      rows: data.rows,
      abonentData: abonentData.rows[0],
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
      const abonentMongo = abonents.find((a) => a.licshet == abonent.licshet);
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

router.get("/abarotka-berildi/:mfy_id", async (req, res) => {
  try {
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
router.get("/abarotka-berilmadi/:mfy_id", async (req, res) => {
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
router.get("/barchasiga-abarotka-berilmadi", async (req, res) => {
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
