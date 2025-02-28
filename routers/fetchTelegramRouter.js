const { bot } = require("../core/bot");
const https = require("https");
const fs = require("fs");
const path = require("path");
const { uploadAsBlob } = require("../middlewares/multer");
const { TEST_BASE_CHANNEL_ID } = require("../constants");
const { default: axios } = require("axios");

const router = require("express").Router();

router.get("/:file_id", async (req, res, next) => {
  try {
    const fileId = req.params.file_id;

    // Faylning URL manzilini olamiz
    const fileLink = await bot.telegram.getFileLink(fileId);

    // Faylni yuklab olib, bufferga saqlash
    https
      .get(fileLink.href, (response) => {
        if (response.statusCode !== 200) {
          return next(
            new Error(
              `Failed to download file, status code: ${response.statusCode}`
            )
          );
        }

        let data = [];

        // Fayl ma'lumotlarini qismlarga bo'lib olish
        response.on("data", (chunk) => {
          data.push(chunk);
        });

        // Ma'lumot to'liq yuklanganda
        response.on("end", () => {
          const fileBuffer = Buffer.concat(data);

          // Faylni mijozga yuborish
          res.setHeader(
            "Content-Disposition",
            `attachment; filename="file.png"`
          );
          res.setHeader("Content-Type", response.headers["content-type"]);
          res.send(fileBuffer);
        });

        response.on("error", (err) => {
          console.error("Error receiving file data:", err);
          next(err);
        });
      })
      .on("error", (err) => {
        console.error("Error with HTTPS request:", err);
        next(err);
      });
  } catch (err) {
    console.error("Error in try block:", err);
    next(err);
  }
});

router.post(
  "/create-document",
  (req, res, next) => {
    req.on("aborted", () => {
      console.warn("Mijoz ulanishni uzib qo‘ydi!");
    });

    uploadAsBlob.single("file")(req, res, function (err) {
      if (err) {
        console.error("Multer error:", err);
        return res.status(400).json({ ok: false, message: err.message });
      }
      next();
    });
  },
  async (req, res, next) => {
    if (!req.file) {
      return res.status(400).json({ ok: false, message: "Fayl yuklanmadi!" });
    }

    try {
      const document = await bot.telegram.sendDocument(TEST_BASE_CHANNEL_ID, {
        source: req.file.buffer,
        filename: req.file.originalname,
      });

      res.json({ ok: true, document_id: document.document.file_id });
    } catch (err) {
      console.error("Telegramga hujjat jo‘natishda xatolik:", err);
      next(err);
    }
  }
);

// Xatolarni ushlovchi middleware
router.use((err, req, res, next) => {
  console.error("Xato:", err);
  res.status(500).json({ ok: false, message: "Ichki server xatosi (500)" });
});

module.exports = router;
