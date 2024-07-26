const enterQaytaHisobAkt = require("../api/cleancity/dxsh/enterQaytaHisobAkt");
const { enterYashovchiSoniAkt } = require("../api/cleancity/dxsh");
const { upload } = require("../middlewares/multer");
const { Mahalla } = require("../models/Mahalla");
const { Counter } = require("../models/Counter");
const { IncomingDocument } = require("../models/IncomingDocument");
const cc = `https://cleancity.uz/`;
const { bot } = require("../core/bot");
const path = require("path");
const { getAbonentDXJ } = require("../api/cleancity/dxsh");
const { getAbonentDataByLicshet } = require("../api/cleancity/dxsh");
const getAbonents = require("../api/cleancity/dxsh/getAbonents");

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
        file_name: req.file.filename,
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
        stack_prescribed_akts_id: "7941", // yashovchi soni akt pachkasi har oy o'zgartiriladi
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
        stack_akts_id: "4439648", // qayta hisob kitob aktlari har oy yangilanadi
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

const uchirilishiKerakBulganAbonentlar = [105120350731];
router.get("/get-abonents-by-mfy-id/:mfy_id", async (req, res) => {
  try {
    const data = await getAbonents({ mfy_id: req.params.mfy_id });
    const filteredData = data.filter((abonent) => {
      return !uchirilishiKerakBulganAbonentlar.includes(
        Number(abonent.licshet)
      );
    });
    res.json({ ok: true, data: filteredData });
  } catch (error) {
    res.json({ ok: false, message: "Internal server error 500" });
    console.error(error);
  }
});

router.get("/get-all-active-mfy", async (req, res) => {
  try {
    const data = await Mahalla.find({ reja: { $gt: 0 } });
    res.json({ ok: true, data });
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

module.exports = router;
