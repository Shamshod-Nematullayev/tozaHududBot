const { Ariza } = require("../models/Ariza");
const { Counter } = require("../models/Counter");

const router = require("express").Router();

router.post("/create", async (req, res) => {
  try {
    // validate the request
    if (!req.body.licshet)
      return res.json({ ok: false, message: "Licshet not found" });
    if (
      req.body.document_type !== "dvaynik" &&
      req.body.document_type !== "viza" &&
      req.body.document_type !== "odam_soni"
    )
      return res.json({ ok: false, message: "Noma'lum xujjat turi kiritildi" });
    if (
      (req.body.document_type === "viza" && !req.body.aktSummasi) ||
      (req.body.document_type === "viza" && req.body.aktSummasi === 0)
    )
      return res.json({
        ok: false,
        message: "Viza arizalariga akt summasi kiritish majburiy!",
      });

    if (req.body.document_type === "dvaynik" && !req.body.ikkilamchi_licshet)
      return res.json({
        ok: false,
        message: "Ikkilamchi aktlarda dvaynik kod kiritilishi majburiy!",
      });
    if (req.body.document_type === "odam_soni") {
      if (!req.body.current_prescribed_cnt || !req.body.next_prescribed_cnt)
        return res.json({
          ok: false,
          message:
            "Odam soni hozirgi kundagi va keyin bo'lishi kerak bo'lgan odam soni kiritilishi majburiy!",
        });
    }

    const counter = await Counter.findOne({ name: "ariza_tartib_raqami" });
    const newAriza = await Ariza.create({
      licshet: req.body.licshet,
      ikkilamchi_licshet: req.body.ikkilamchi_licshet,
      asosiy_licshet: req.body.asosiy_licshet,
      document_number: counter.value + 1,
      document_type: req.body.document_type,
      comment: req.body.comment,
      current_prescribed_cnt: req.body.current_prescribed_cnt,
      next_prescribed_cnt: req.body.next_prescribed_cnt,
      aktSummasi: parseInt(req.body.aktSummasi),
      sana: Date.now(),
    });
    await counter.updateOne({ $set: { value: counter.value + 1 } });
    res.json({ ok: true, ariza: newAriza });
  } catch (error) {
    console.error(error);
    res.json({ ok: false, message: `internal error: ${error.message}` });
  }
});

module.exports = router;
