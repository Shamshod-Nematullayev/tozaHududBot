const router = require("express").Router();
const { Nazoratchi } = require("../models/Nazoratchi");
const { Mahalla } = require("../models/Mahalla");

router.get("/", async (req, res) => {
  try {
    const inspectors = await Nazoratchi.find();
    const mahallalar = await Mahalla.find({ reja: { $gt: 0 } });
    const rows = [];
    inspectors.forEach((person) => {
      // let topildi = false
      const inspektor = {
        _id: person._id,
        id: person.id,
        name: person.name,
        biriktirilgan: [],
      };
      mahallalar.forEach((mfy) => {
        if (mfy.biriktirilganNazoratchi.inspactor_id > 0) {
          if (mfy.biriktirilganNazoratchi.inspactor_id == person.id) {
            inspektor.biriktirilgan.push({
              mfy_id: mfy.id,
              mfy_name: mfy.name,
            });
          }
        }
      });
      rows.push(inspektor);
    });
    res.json({
      ok: true,
      rows: rows,
    });
  } catch (error) {
    res.json({ ok: false, message: "Internal server error" });
  }
});

module.exports = router;
