const { SudAkt } = require("../models/SudAkt");
const { SudAktPachka } = require("../models/SudAktPachka");
const { Bildirishnoma } = require("../models/SudBildirishnoma");

// GET get all datas
module.exports.getAllAkts = async (req, res, next) => {
  try {
    const aktlar = await SudAkt.find();
    res.status(200).json({
      ok: true,
      aktlar,
    });
  } catch (ex) {
    next(ex);
  }
};

// GET data by id
module.exports.getAktById = async (req, res, next) => {
  try {
    const akt = await SudAkt.findById(req.params.id);
    if (!akt) {
      return res.status(404).json({
        ok: false,
        message: "Ma'lumot topilmadi",
      });
    }

    res.status(200).json({
      ok: true,
      akt,
    });
  } catch (ex) {
    next(ex);
  }
};

// POST create new akt
module.exports.createNewAkt = async (req, res, next) => {
  try {
    const { kod, bildirish_xati_raqami, fish, pachka_id, qarzdorlik } =
      req.body;
    const bildirgi = await Bildirishnoma.findOne({
      doc_num: bildirish_xati_raqami,
    });

    if (!bildirgi) {
      return res.json({
        ok: false,
        message: "Siz yuborgan bildirish xati raqami aniqlanmadi",
        kod,
        bildirish_xati_raqami,
      });
    }
    const akt = await SudAkt.findOne({ kod });
    if (akt) {
      return res.json({
        ok: false,
        message: "Siz yuborgan kodga allaqachon akt yaratilgan" + " " + kod,
      });
    }
    await SudAkt.create({
      kod,
      bildirish_xat: {
        raqami: bildirgi.doc_num,
        link: bildirgi.file_link,
      },
      fish,
      pachka_id,
      qarzdorlik,
    }).then(async (akt) => {
      await SudAktPachka.findByIdAndUpdate(pachka_id, {
        $push: { elements: akt._id },
      });
      res.status(201).json({
        ok: true,
        akt,
      });
    });
  } catch (ex) {
    next(ex);
  }
};

// PUT update data by id
module.exports.updateAktById = async (req, res, next) => {
  try {
    const { id } = req.params;
    await SudAkt.findByIdAndUpdate(id, {
      $set: {
        ...req.body,
      },
    })
      .catch((err) => {
        res.status(400).send(err);
      })
      .then((akt) => {
        res.status(200).json({
          ok: true,
          akt,
        });
      });
  } catch (ex) {
    next(ex);
  }
};
// PUT update data by id
module.exports.updateAktByKod = async (req, res, next) => {
  try {
    const { KOD, ...others } = req.body;
    await SudAkt.updateOne(
      { kod: KOD },
      {
        $set: {
          ...others,
        },
      }
    )
      .catch((err) => {
        res.status(400).send(err);
      })
      .then((akt) => {
        res.status(200).json({
          ok: true,
          akt,
        });
      });
  } catch (ex) {
    next(ex);
  }
};

// DELETE delete one data
module.exports.deleteById = async (req, res, next) => {
  try {
    const akt = await SudAkt.findById(req.params.id);
    await SudAkt.findByIdAndDelete(req.params.id)
      .catch((err) => {
        res.status(400).send(err);
      })
      .then(async () => {
        const pachka = await SudAktPachka.findById(akt.pachka_id);
        await SudAktPachka.findByIdAndUpdate(akt.pachka_id, {
          $pull: { elements: akt._id },
        }).then(() => {
          res.status(200).json({
            ok: true,
            message: "Deleted success",
          });
        });
      });
  } catch (ex) {
    next(ex);
  }
};
