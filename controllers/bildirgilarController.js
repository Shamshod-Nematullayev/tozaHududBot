const { Bildirishnoma } = require("../models/SudBildirishnoma");

// GET get all datas
module.exports.getAllBildirgilar = async (req, res, next) => {
  try {
    const bildirgilar = await Bildirishnoma.find({ type: "sudga_chiqoring" });
    res.status(200).json({
      ok: true,
      bildirgilar,
    });
  } catch (ex) {
    next(ex);
  }
};

// GET data by id
module.exports.getBildirgiById = async (req, res, next) => {
  try {
    const bildirgi = await Bildirishnoma.findById(req.params.id);
    if (!bildirgi) {
      return res.status(404).json({
        ok: false,
        message: "Ma'lumot topilmadi",
      });
    }

    res.status(200).json({
      ok: true,
      bildirgi,
    });
  } catch (ex) {
    next(ex);
  }
};
