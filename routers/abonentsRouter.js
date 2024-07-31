const router = require("express").Router();
const { Abonent } = require("../models/Abonent");

router.get("/", (req, res) => res.json({ ok: true }));
router.get("/get-one-abonent-by-licshet/:licshet", async (req, res) => {
  try {
    const abonents = await Abonent.find({
      licshet: new RegExp(req.params.licshet),
    });
    if (!abonents) {
      return res.json({
        ok: false,
        message: "Not Found",
      });
    }
    if (abonents.length > 1) {
      return res.json({
        ok: false,
        message: "Mos keladigan ma'lumotlar 1 donadan ko'p",
      });
    }

    res.json({
      ok: true,
      rows: [abonents],
    });
  } catch (err) {
    console.error(new Error(err));
    res
      .json({
        ok: false,
        message: "Enternal server error",
      })
      .status(500);
  }
});

module.exports = router;
