const { SudAktPachka } = require("../models/SudAktPachka");
const { SudAkt } = require("../models/SudAkt");
const compresser = require("compressing");
const { bot } = require("../core/bot");
const https = require("https");
const fs = require("fs");
const path = require("path");

module.exports.getAllPachka = async (req, res, next) => {
  try {
    const pachkalar = await SudAktPachka.find();
    res.json({
      ok: true,
      pachkalar,
    });
  } catch (error) {
    next(error);
  }
};

module.exports.getElementsPachka = async (req, res, next) => {
  try {
    const pachka = await SudAktPachka.findById(req.params.pachka_id);
    const aktlar = [];
    if (pachka.elements.length) {
      for (let i = 0; i < pachka.elements.length; i++) {
        const akt_id = pachka.elements[i];
        const akt = await SudAkt.findById(akt_id);
        aktlar.push(akt);
      }
    }
    res.json({
      ok: true,
      aktlar,
    });
  } catch (error) {
    next(error);
  }
};

module.exports.createNewPachka = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    await SudAktPachka.create({
      name,
      description,
    }).then(() => {
      res.json({
        ok: true,
        message: "Yaratildi",
      });
    });
  } catch (error) {
    next(error);
  }
};

module.exports.updatePachkaById = async (req, res, next) => {
  try {
    await SudAktPachka.findByIdAndUpdate(req.params.pachka_id, {
      ...req.body,
    }).then(() => {
      res.json({
        ok: true,
        message: "Yangilandi",
      });
    });
  } catch (error) {
    next(error);
  }
};

module.exports.deletePachkaById = async (req, res, next) => {
  try {
    const pachka = await SudAktPachka.findById(req.params.pachka_id);
    if (pachka.elements.length === 0)
      await SudAktPachka.findByIdAndDelete(req.params.pachka_id).then(() => {
        res.json({
          ok: true,
          message: "O'chirib tashlandi",
        });
      });
    else
      res.json({
        ok: false,
        message: "Bu pachkada bola elementlar mavjud",
      });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

module.exports.sudgaYuborish = async (req, res, next) => {
  try {
    const pachka = await SudAktPachka.findById(req.params.pachka_id);

    let counter = 0;
    fs.mkdir(path.join("uploads", "forma1lar"), async (e) => {
      for (let i = 0; i < pachka.elements.length; i++) {
        const _id = pachka.elements[i];

        const akt = await SudAkt.findById(_id);
        if (akt.forma_bir.topildi && akt.status === "YANGI") {
          counter++;
          bot.telegram.getFileLink(akt.forma_bir.file_id).then((file) => {
            https.get(file.href, (respond) => {
              const fileStream = fs.createWriteStream(
                path.join("uploads", "forma1lar", `${akt.kod}.png`)
              );
              respond.pipe(fileStream);
              fileStream.on("finish", () => {
                fileStream.close();
              });
            });
          });
        }
      }
    });
    compresser.zip
      .compressDir(
        path.join("uploads", "forma1lar"),
        path.join("uploads", "forma1lar.zip")
      )
      .then(async () => {
        await bot.telegram
          .sendDocument(
            process.env.STM_ANVARJON_GROUP_ID,
            { source: path.join("uploads", "forma1lar.zip") },
            {
              parse_mode: "HTML",
              caption: `ID: ${pachka._id}\n<b>${pachka.name}</b>\nforma1: ${counter} ta`,
            }
          )
          .then(async () => {
            fs.unlink(path.join("uploads", "forma1lar.zip"), (e) => {});
            fs.readdir(
              path.join("uploads", "forma1lar"),
              async (err, files) => {
                if (err) throw err;

                for (const file of files) {
                  fs.unlink(
                    path.join(path.join("uploads", "forma1lar"), file),
                    (err) => {
                      if (err) throw err;
                    }
                  );
                }
                await SudAktPachka.findByIdAndUpdate(req.params.pachka_id, {
                  $set: {
                    sended_sud: true,
                    sended_sud_time: Date.now(),
                  },
                }).then(() => {
                  res.json({
                    ok: true,
                    message: `${counter} dona xujjat sudga yuborildi.`,
                  });
                });
              }
            );
          });
      });
  } catch (error) {
    next(error);
    console.log(error);
  }
};
