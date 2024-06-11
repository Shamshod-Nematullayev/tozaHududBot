const {
  enterQaytaHisobAkt,
} = require("../api/cleancity/dxsh/enterQaytaHisobAkt");
const {
  enterYashovchiSoniAkt,
} = require("../api/cleancity/dxsh/enterYashovchiSoniAkt");
const { upload } = require("../middlewares/multer");
const { CleanCitySession } = require("../models/CleanCitySession");
const { Counter } = require("../models/Counter");
const { IncomingDocument } = require("../models/IncomingDocument");
const cc = `https://cleancity.uz/`;
const { bot } = require("../core/bot");
const path = require("path");
const { getAbonentDXJ } = require("../api/cleancity/dxsh/getAbonentDXJ");
const {
  getAbonentDataByLicshet,
} = require("../api/cleancity/dxsh/getAbonentData");

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
        stack_prescribed_akts_id: "7618", // yashovchi soni akt pachkasi har oy o'zgartiriladi
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
        stack_akts_id: "4437436", // qayta hisob kitob aktlari har oy yangilanadi
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

module.exports = router;
