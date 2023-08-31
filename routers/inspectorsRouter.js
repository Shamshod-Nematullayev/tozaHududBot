const { Nazoratchi } = require("../models/Nazoratchi");

const router = require("express").Router();

router.get("/", async (req, res) => {
  try {
    const inspectors = await Nazoratchi.find();
    res.json({
      ok: true,
      inspectors,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Enternal server error");
  }
});

module.exports = router;
