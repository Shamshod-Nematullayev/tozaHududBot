const { Ariza } = require("../models/Ariza");
const { Counter } = require("../models/Counter");
const { Abonent } = require("../models/Abonent");

const router = require("express").Router();

router.get("/", async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortField = "sana",
      sortDirection = "asc",
      document_type,
      document_number,
      account_number,
      dublicat_account_number,
      created_from_date,
      created_to_date,
      act_from_date,
      act_to_date,
      act_amount_from,
      act_amount_to,
      ariza_status,
      act_status,
    } = req.query;

    const sortOptions = {};
    sortOptions[sortField] = sortDirection === "asc" ? 1 : -1;

    const skip = (parseInt(page) - 1) * limit; // Nechta elementni o'tkazib yuborish

    // Filtrni dinamik shakllantirish
    const filters = {};
    if (document_type) filters.document_type = document_type;
    if (document_number) filters.document_number = document_number;
    if (account_number) filters.licshet = account_number;
    if (dublicat_account_number)
      filters.ikkilamchi_licshet = dublicat_account_number;
    if (created_from_date) filters.sana = { $gte: new Date(created_from_date) };
    if (created_to_date)
      filters.sana = {
        ...filters.sana,
        $lte: new Date(created_to_date),
      };
    if (act_from_date) filters.akt_date = { $gte: new Date(act_from_date) };
    if (act_to_date)
      filters.akt_date = { ...filters.akt_date, $lte: new Date(act_to_date) };
    if (act_amount_from)
      filters.aktSummasi = { $gte: parseFloat(act_amount_from) };
    if (act_amount_to)
      filters.aktSummasi = {
        ...filters.aktSummasi,
        $lte: parseFloat(act_amount_to),
      };
    if (ariza_status) filters.status = ariza_status;
    if (act_status) filters.actStatus = act_status;

    // Ma'lumotlarni qidirish
    const data = await Ariza.find(filters)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
      .lean(); // Plain obyekt

    const totalCount = await Ariza.countDocuments(filters);

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
  } catch (error) {
    res
      .status(500)
      .json({ ok: false, message: `internal error: ${error.message}` });
  }
});

router.get("/:_id", async (req, res) => {
  try {
    const ariza = await Ariza.findById(req.params._id).lean();
    const abonent = await Abonent.findOne({ licshet: ariza.licshet });
    if (!ariza)
      return res.json({
        ok: false,
        message: "Ariza topilmadi",
      });
    ariza.fio = abonent.fio;
    res.json({
      ok: true,
      ariza,
    });
  } catch (error) {
    console.error(error);
    res.json({ ok: false, message: `internal error: ${error.message}` });
  }
});
router.get(
  "/get-ariza-by-document-number/:document_number",
  async (req, res) => {
    try {
      const ariza = await Ariza.findOne({
        document_number: parseInt(req.params.document_number),
      }).lean();
      const abonent = await Abonent.findOne({ licshet: ariza.licshet });
      if (!ariza)
        return res.json({
          ok: false,
          message: "Ariza topilmadi",
        });

      ariza.fio = abonent.fio;
      res.json({
        ok: true,
        ariza: ariza,
      });
    } catch (error) {
      console.error(error);
      res.json({ ok: false, message: `internal error: ${error.message}` });
    }
  }
);

router.post("/cancel-ariza-by-id", async (req, res) => {
  try {
    const { _id, canceling_description } = req.body;
    const ariza = await Ariza.findByIdAndUpdate(_id, {
      $set: {
        status: "bekor qilindi",
        canceling_description,
        is_canceled: true,
      },
    });
    if (!ariza)
      return res.json({
        ok: false,
        message: "Ariza topilmadi",
      });
    res.json({ ok: true, message: "Ariza bekor qilindi" });
  } catch (error) {
    console.error(error);
    res.json({ ok: false, message: `internal error: ${error.message}` });
  }
});

router.post("/create", async (req, res) => {
  try {
    const {
      licshet,
      ikkilamchi_licshet,
      document_type,
      akt_summasi,
      current_prescribed_cnt,
      next_prescribed_cnt,
      comment,
      photos,
      recalculationPeriods,
      muzlatiladi,
    } = req.body;
    // validate the request
    if (!licshet) return res.json({ ok: false, message: "Licshet not found" });
    if (
      document_type !== "dvaynik" &&
      document_type !== "viza" &&
      document_type !== "odam_soni" &&
      document_type !== "death" &&
      document_type !== "gps"
    )
      return res.json({ ok: false, message: "Noma'lum xujjat turi kiritildi" });
    if (
      (document_type === "viza" && !akt_summasi.total) ||
      (document_type === "viza" && akt_summasi.total === 0)
    )
      return res.json({
        ok: false,
        message: "Viza arizalariga akt summasi kiritish majburiy!",
      });

    if (document_type === "dvaynik" && !ikkilamchi_licshet)
      return res.json({
        ok: false,
        message: "Ikkilamchi aktlarda dvaynik kod kiritilishi majburiy!",
      });
    if (document_type === "odam_soni") {
      if (isNaN(current_prescribed_cnt) || isNaN(next_prescribed_cnt))
        return res.json({
          ok: false,
          message:
            "Odam soni hozirgi kundagi va keyin bo'lishi kerak bo'lgan odam soni kiritilishi majburiy!",
        });
    }
    if (
      document_type === "death" &&
      next_prescribed_cnt === current_prescribed_cnt &&
      akt_summasi.total === 0
    ) {
      if (!current_prescribed_cnt || !next_prescribed_cnt)
        return res.json({
          ok: false,
          message: "Majburiy qiymatlar kiritilmagan",
        });
    }

    const counter = await Counter.findOne({ name: "ariza_tartib_raqami" });
    const newAriza = await Ariza.create({
      licshet: licshet,
      ikkilamchi_licshet: ikkilamchi_licshet,
      asosiy_licshet: licshet,
      document_number: counter.value + 1,
      document_type: document_type,
      comment: comment,
      current_prescribed_cnt: current_prescribed_cnt,
      next_prescribed_cnt: next_prescribed_cnt,
      aktSummasi: parseInt(akt_summasi.total),
      aktSummCounts: akt_summasi,
      sana: Date.now(),
      photos: photos,
      recalculationPeriods: recalculationPeriods,
      muzlatiladi: muzlatiladi,
    });
    await counter.updateOne({ $set: { value: counter.value + 1 } });
    res.json({ ok: true, ariza: newAriza });
  } catch (error) {
    console.error(error);
    res.json({ ok: false, message: `internal error: ${error.message}` });
  }
});

router.patch("/move-to-inbox/:ariza_id", async (req, res) => {
  try {
    await Ariza.findByIdAndUpdate(req.params.ariza_id, {
      $set: {
        acceptedDate: new Date(),
        status: "qabul qilindi",
      },
    });
    res.status(200).json({
      ok: true,
    });
  } catch (error) {
    console.error(error);
    res.json({ ok: false, message: `internal error: ${error.message}` });
  }
});
router.patch("/:ariza_id", async (req, res) => {
  try {
    await Ariza.findByIdAndUpdate(
      req.params.ariza_id,
      {
        $set: {
          ...req.body,
        },
      },
      { new: true }
    );
    res.status(200).json({
      ok: true,
    });
  } catch (error) {
    console.error(error);
    res.json({ ok: false, message: `internal error: ${error.message}` });
  }
});

module.exports = router;
