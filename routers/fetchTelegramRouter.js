const { bot } = require("../core/bot");
const https = require("https");
const fs = require("fs");
const path = require("path");

const router = require("express").Router();

router.get("/:file_id", (req, res, next) => {
  try {
    bot.telegram
      .getFileLink(req.params.file_id)
      .then((result) => {
        https.get(result.href, (respons) => {
          let kengaytma = "";
          bot.telegram.getFile(req.params.file_id).then((r) => {
            kengaytma = "file.pdf";
            const fileStream = fs.createWriteStream(kengaytma);
            respons.pipe(fileStream);
            fileStream.on("finish", () => {
              fileStream.close();
              res.download(kengaytma);
            });
          });
        });
      })
      .catch((err) => {
        console.log(err);
      });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
