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

    // Get the file link
    const fileLink = await bot.telegram.getFileLink(fileId);

    https
      .get(fileLink.href, (response) => {
        const fileName = Date.now() + "file.png";
        const fileStream = fs.createWriteStream(fileName);

        response.pipe(fileStream);

        fileStream.on("finish", () => {
          fileStream.close();

          // Send the file to the client
          res.download(fileName, (err) => {
            if (err) {
              console.error("Error downloading the file:", err);
              next(err);
            } else {
              // Remove the file after sending it
              fs.unlink(fileName, (unlinkErr) => {
                if (unlinkErr) {
                  console.error("Error deleting the file:", unlinkErr);
                }
              });
            }
          });
        });

        fileStream.on("error", (err) => {
          console.error("Error writing to file stream:", err);
          next(err);
        });
      })
      .on("error", (err) => {
        console.error("Error with https get request:", err);
        next(err);
      });
  } catch (err) {
    console.error("Error in the try block:", err);
    next(err);
  }
});

router.post(
  "/create-document",
  uploadAsBlob.single("file"),
  async (req, res) => {
    try {
      const document = await bot.telegram.sendDocument(TEST_BASE_CHANNEL_ID, {
        source: req.file.buffer,
      });
      res.json({ ok: true, document_id: document.document.file_id });
    } catch (err) {
      console.error(err);
      res.status(500).json({ ok: false, message: "Internal server error 500" });
    }
  }
);

module.exports = router;
