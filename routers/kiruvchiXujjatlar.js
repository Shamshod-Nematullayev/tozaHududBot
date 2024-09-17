const { upload } = require("../middlewares/multer");
const { IncomingDocument } = require("../models/IncomingDocument");
const path = require("path");
const { bot } = require("../core/bot");
const { Counter } = require("../models/Counter");
const fs = require("fs");

const router = require("express").Router();

// get all documents
router.get("/", async (req, res, next) => {
  try {
    const documents = await IncomingDocument.find();
    res.json({
      ok: true,
      documents,
    });
  } catch (err) {
    next(err);
  }
});

// bir xujjatni ID raqami orqali oish
router.get("/:document_id", async (req, res, next) => {
  try {
    const document = await IncomingDocument.findById(req.params.document_id);
    if (!document) {
      return res.json({
        ok: false,
        message: "Xujjat topilmadi",
      });
    }
    res.json({
      ok: true,
      document,
    });
  } catch (err) {
    next(err);
  }
});

// bir yoki bir necha xujjatni filtr ma'lumotlari asosida olish
router.post("/search", async (req, res, next) => {
  try {
    const documents = await IncomingDocument.find({ ...req.body });
    if (documents.length < 1) {
      return res.json({
        ok: false,
        message: "Xujjat topilmadi",
      });
    } else if (documents.length == 1) {
      return res.json({
        ok: true,
        res_type: "single",
        document: documents[0],
      });
    } else {
      return res.json({
        ok: true,
        res_type: "multi",
        documents,
      });
    }
  } catch (err) {
    next(err);
  }
});

router.post("/create", upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file || !req.body.doc_type) {
      return res
        .status(400)
        .json({ ok: false, message: "Required fields are missing" });
    }
    const filePath = path.join(__dirname, "../uploads/", req.file.filename);
    const telegramResponse = await bot.telegram.sendDocument(
      process.env.TEST_BASE_CHANNEL_ID,
      { source: filePath }
    );
    const counter = await Counter.findOne({ name: "incoming_document_number" });
    if (!counter) {
      return res.status(500).json({ ok: false, message: "Counter not found" });
    }

    const newDocument = await IncomingDocument.create({
      abonent: req.body.abonent,
      abonents: req.body.abonents,
      doc_type: req.body.doc_type,
      inspector: req.body.inspector,
      file_id: telegramResponse.document.file_id,
      file_name: req.file.filename,
      comment: req.body.comment,
      date: new Date(),
      doc_num: counter.value + 1,
    });

    await counter.updateOne({
      $set: {
        value: counter.value + 1,
        last_update: new Date(),
      },
    });

    // Delete the uploaded file
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error("Failed to delete uploaded file:", err);
      }
    });

    return res.json({
      ok: true,
      document: newDocument,
      message: "Xujjat qabul qilindi",
    });
  } catch (error) {
    console.error("Error while creating document:", error);
    return res
      .status(500)
      .json({ ok: false, message: "Internal Server Error" });
  }
});

router.put("/:file_id", async (req, res, next) => {
  try {
    await IncomingDocument.findOneAndUpdate(req.params.file_id, {
      $set: {
        ...req.body,
      },
    });
    res.json({
      ok: true,
      message: "Yangilandi",
    });
  } catch (err) {
    res.json({
      ok: false,
      message: "tizim xatosi",
    });
    next(err);
  }
});

module.exports = router;
