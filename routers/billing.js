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

const router = require("express").Router();
router.get("/", (req, res) => {
  res.json({ ok: true, message: "Router is working" });
});

router.post("/create-full-akt", upload.single("file"), async (req, res) => {
  try {
    const documentOnTelegram = await bot.telegram.sendDocument(
      process.env.TEST_BASE_CHANNEL_ID,
      {
        source: path.join(__dirname, "../uploads/", req.file.filename),
      }
    );
    const counter = await Counter.findOne({ name: "incoming_document_number" });
    const document = await IncomingDocument.create({
      abonent: req.body.abonent,
      doc_type: req.body.doc_type,
      inspector: req.body.inspector,
      file_id: documentOnTelegram.document.file_id,
      file_name: req.file.filename,
      comment: req.body.comment,
      date: Date.now(),
      doc_num: counter.value + 1,
    });
    const yashovchi = await enterYashovchiSoniAkt({
      akt_number: counter.value + 1,
      comment: req.body.comment,
      filepath: path.join(__dirname, "../uploads/", req.file.filename),
      licshet: req.body.abonent,
      prescribed_cnt: req.body.prescribed_cnt,
      stack_prescribed_akts_id: "7191", // yashovchi soni akt pachkasi har oy o'zgartiriladi
    });
    const qaytahisob = await enterQaytaHisobAkt({
      akt_number: counter.value + 1,
      comment: req.body.comment,
      amount: req.body.amount,
      filepath: path.join(__dirname, "../uploads/", req.file.filename),
      licshet: req.body.abonent,
      stack_akts_id: "4435032", // qayta hisob kitob aktlari har oy yangilanadi
    });
    await counter.updateOne({
      $set: {
        value: counter.value + 1,
        last_update: Date.now(),
      },
    });
    res.json({
      ok: qaytahisob.success && yashovchi.success ? true : false,
      qaytahisob,
      yashovchi,
    });
  } catch (err) {
    console.error(err);
  }
});

module.exports = router;
