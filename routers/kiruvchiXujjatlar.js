const { upload } = require("../middlewares/multer");
const { IncomingDocument } = require("../models/IncomingDocument");
const path = require("path");
const { bot } = require("../core/bot");

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
    const documentOnTelegram = await bot.telegram.sendDocument(
      process.env.TEST_BASE_CHANNEL_ID,
      {
        source: path.join(__dirname, "../uploads/", req.file.filename),
      }
    );
    const document = await IncomingDocument.create({
      user: req.body.user,
      abonent: req.body.abonent,
      abonents: req.body.abonents,
      date: Date.now(),
      doc_type: req.body.doc_type,
      inspector: req.body.inspector,
      file_id: documentOnTelegram.document.file_id,
      filename: req.file.filename,
    });

    return res.json({
      ok: true,
      document,
      message: "Xujjat qabul qilindi",
    });
  } catch (err) {
    next(err);
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
