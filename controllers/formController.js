const { bot } = require("../core/bot");
const { Picture } = require("../models/Picture");
const path = require("path");
const { SudAkt } = require("../models/SudAkt");
const decompress = require("decompress");
const fs = require("fs");

module.exports.getAllForm = async (req, res, next) => {
  try {
    const forma1lar = await Picture.find();
    res.status(200).json({
      ok: true,
      forma1lar,
    });
  } catch (ex) {
    next(ex);
  }
};

module.exports.getFormById = async (req, res, next) => {
  try {
    const forma1 = await Picture.findById(req.params.id);
    res.status(200).json({
      ok: true,
      forma1,
    });
  } catch (ex) {
    next(ex);
  }
};

module.exports.createForm = async (req, res, next) => {
  try {
    const akt = await SudAkt.findOne({ kod: req.body.kod });
    if (!akt) {
      return res.json({ ok: false, message: "Bu raqamli akt topilmadi" });
    }
    bot.telegram
      .sendDocument(process.env.TEST_BASE_CHANNEL_ID, {
        source: path.join(__dirname, "../uploads/", req.file.filename),
      })
      .then(async (ctx) => {
        await Picture.create({
          confirm: "TASDIQLANDI",
          createdAt: Date.now(),
          kod: req.body.kod,
          messageIdChannel: ctx.message_id,
          photo_file_id: ctx.document.file_id,
          type: "FORM1",
          file_name: req.body.file_name,
        }).then(async () => {
          await SudAkt.updateOne(
            { kod: req.body.kod },
            {
              $set: {
                forma_bir: { topildi: true, file_id: ctx.document.file_id },
              },
            }
          ).catch((err) => console.log(err));
          res.json({ ok: true, message: "Muvaffaqqiyatli qo'shildi" });
        });
      });
  } catch (err) {
    console.log(err);
    next(err);
  }
};

module.exports.importForm = async (req, res, next) => {
  try {
    decompress(
      path.join(__dirname, "../uploads/forma1.zip"),
      path.join(__dirname, "../uploads/forma1")
    ).then(() => {
      fs.readdir("./uploads/forma1", "utf-8", async (err, files) => {
        if (err) {
          console.log(err);
          return res.json({ ok: false, message: "Xatolik" });
        }
        let messages = null;
        let forma1Repeat = false;
        let takrorlanuvchilar = [];
        let aktDefined = false;
        let yoqolganlar = [];
        for (file_name of files) {
          const kod = file_name.split(".")[0];
          const akt = await SudAkt.findOne({ kod });
          const forma1 = await Picture.findOne({ kod });

          if (forma1) {
            takrorlanuvchilar.push(kod);
            forma1Repeat = true;
          }
          if (!akt) {
            yoqolganlar.push(kod);
            aktDefined = true;
          }
        }

        if (forma1Repeat) {
          return res.json({
            ok: false,
            message: `${JSON.stringify(
              takrorlanuvchilar
            )} ushbular takrorlanib kelyapti `,
          });
        }
        if (aktDefined) {
          return res.json({
            ok: false,
            message: `${JSON.stringify(yoqolganlar)} ushbular akti topilmadi`,
          });
        }
        for (file_name of files) {
          const kod = file_name.split(".")[0];

          bot.telegram
            .sendDocument(process.env.TEST_BASE_CHANNEL_ID, {
              source: path.join(__dirname, "../uploads/forma1", file_name),
            })
            .then(async (ctx) => {
              await Picture.create({
                confirm: "YANGI",
                createdAt: Date.now(),
                kod,
                messageIdChannel: ctx.message_id,
                photo_file_id: ctx.document.file_id,
                type: "FORM1",
              }).then(async () => {
                await SudAkt.updateOne(
                  { kod },
                  {
                    $set: {
                      forma_bir: {
                        topildi: true,
                        file_id: ctx.document.file_id,
                      },
                    },
                  }
                ).catch((err) => console.log(err));
              });
            });
        }
        res.json({ ok: true, message: "Muvaffaqqiyatli qo'shildi" });
      });
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
};
