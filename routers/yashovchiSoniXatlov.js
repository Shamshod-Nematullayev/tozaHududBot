const { MultiplyRequest } = require("../requires");

const router = require("express").Router();

router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 10, ...filters } = req.query;
    const skip = (parseInt(page) - 1) * limit; // Nechta elementni o'tkazib yuborish
    const data = await MultiplyRequest.find(filters) // Filtrlash
      .skip(skip) // Paging
      .limit(parseInt(limit)) // Limit
      .lean(); // Faqatgina "plain" obyekt qaytarish uchun (performance uchun yaxshi)
    const totalCount = await MultiplyRequest.countDocuments(filters); // Toplam sonliqni o'qish

    res.status(200).json({
      ok: true,
      data: data,
      meta: {
        total: totalCount,
        page: page,
        limit: limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});
router.get("/:mahallaId", async (req, res) => {
  try {
    const { mahallaId } = req.params;
    const requests = await MultiplyRequest.find({
      "abonent.mahallas_id": mahallaId,
    });
    res.json({
      ok: true,
      data: requests,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { abonents, mfy_id } = req.body;
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;
