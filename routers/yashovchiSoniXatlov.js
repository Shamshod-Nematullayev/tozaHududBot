const { tozaMakonApi } = require("../api/tozaMakon");
const { Mahalla } = require("../models/Mahalla");
const { XatlovDocument } = require("../models/XatlovDocument");
const { MultiplyRequest } = require("../models/MultiplyRequest");

const router = require("express").Router();

router.post("/", async (req, res) => {
  try {
    const { request_ids, mahallaId } = req.body;
    if (!mahallaId) {
      return res.status(400).json({ message: "mahallaId is required" });
    }
    const countDocuments = await XatlovDocument.countDocuments();
    const document = await XatlovDocument.create({
      request_ids,
      mahallaId,
      date: new Date(),
      documentNumber: countDocuments + 1,
    });
    const mahalla = await Mahalla.findOne({ id: parseInt(mahallaId) });
    res.status(201).json({ ok: true, data: document, mahalla });
    for (let _id of request_ids) {
      await MultiplyRequest.findByIdAndUpdate(_id, {
        $set: { document_id: document._id },
      });
    }
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});
router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = "", ...filters } = req.query;
    const skip = (parseInt(page) - 1) * limit; // Nechta elementni o'tkazib yuborish
    const data = await MultiplyRequest.find({
      ...filters,
      confirm: false,
    }) // Filtrlash
      .sort(sort)
      .skip(skip) // Paging
      .limit(parseInt(limit)) // Limit
      .lean(); // Faqatgina "plain" obyekt qaytarish uchun (performance uchun yaxshi)
    const totalCount = await MultiplyRequest.countDocuments({
      ...filters,
      confirm: false,
    }); // Toplam sonliqni o'qish

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
    console.error(err);
    res.status(500).json({ ok: false, message: err.message });
  }
});

router.patch("/update-from-tozamakon/:_id", async (req, res) => {
  try {
    const { _id } = req.params;
    const { abonentId } = req.body;
    const { data } = await tozaMakonApi.get(
      "/user-service/residents/" + abonentId
    );
    const result = await MultiplyRequest.findByIdAndUpdate(_id, {
      $set: {
        fio: data.fullName,
        currentInhabitantCount: data.house.inhabitantCnt,
      },
    });
    if (!result) {
      return res.status(404).json({ ok: false, message: "Not Found" });
    }
    res.status(200).json({ ok: true });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.put("/:_id", async (req, res) => {
  try {
    const { _id } = req.params;
    const result = await MultiplyRequest.findByIdAndUpdate(_id, {
      $set: req.body,
    });
    if (!result) {
      return res.status(404).json({ ok: false, message: "Not Found" });
    }
    res.status(200).json({ ok: true });
  } catch (error) {
    res.status(500).json({ ok: false, message: "Internal Server Error" });
  }
});

router.get("/get-one-dalolatnoma", async (req, res) => {
  try {
    const dalolatnoma = await XatlovDocument.findOne(req.query);
    if (!dalolatnoma)
      return res.status(404).json({ ok: false, message: "Not found" });
    res.json({ ok: true, data: dalolatnoma });
  } catch (error) {
    res.status(500).json({ ok: false, message: "Internal server error" });
  }
});

router.get("/get-rows-by-ids", async (req, res) => {
  try {
    const { request_ids } = req.query;
    const rows = await MultiplyRequest.find({ _id: { $in: request_ids } });
    if (!rows.length)
      return res.status(404).json({ ok: false, message: "No records found" });
    res.json({ ok: true, data: rows });
  } catch (error) {
    res.status(500).json({ ok: false, message: "Internal server error" });
  }
});

module.exports = router;
