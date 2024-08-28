const { Ariza } = require("../models/Ariza");
const { Counter } = require("../models/Counter");

const router = require("express").Router();

router.post("/create", async (req, res) => {
  try {
    const counter = await Counter.findOne({ name: "ariza_tartib_raqami" });
    const newAriza = await Ariza.create({
      licshet: req.body.licshet,
      ikkilamchi_licshet: req.body.ikkilamchi_licshet,
      asosiy_licshet: req.body.asosiy_licshet,
      document_number: counter.value + 1,
      document_type: req.body.document_type,
    });
    await counter.updateOne({ $set: { value: counter.value + 1 } });
    res.json({ ok: true, ariza: newAriza });
  } catch (error) {
    console.error(error);
    res.json({ ok: false, message: `internal error: ${error.message}` });
  }
});

module.exports = router;
