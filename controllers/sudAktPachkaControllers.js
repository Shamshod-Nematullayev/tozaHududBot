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
