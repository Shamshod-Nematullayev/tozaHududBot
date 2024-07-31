const { bot } = require("../core/bot");
const https = require("https");
const fs = require("fs");
const path = require("path");

const router = require("express").Router();

router.get("/:file_id", async (req, res, next) => {
  try {
    const fileId = req.params.file_id;

    // Get the file link
    const fileLink = await bot.telegram.getFileLink(fileId);

    https
      .get(fileLink.href, (response) => {
        const fileName = "file.pdf";
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

module.exports = router;

module.exports = router;
