const { tozaMakonApi } = require("../../api/tozaMakon");
const { Ariza } = require("../../models/Ariza");
const { Abonent } = require("../../requires");

module.exports.getArizalar = async (req, res) => {
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
};

module.exports.getArizaById = async (req, res) => {
  try {
    const ariza = await Ariza.findById(req.params._id).lean();
    const abonent = await Abonent.findOne({ licshet: ariza.licshet });
    if (!ariza)
      return res.status(404).json({
        ok: false,
        message: "Ariza topilmadi",
      });
    ariza.fio = abonent.fio;
    ariza.abonentId = abonent.id;
    res.json({
      ok: true,
      ariza,
    });
  } catch (error) {
    console.error(error);
    res.json({ ok: false, message: `internal error: ${error.message}` });
  }
};

module.exports.updateArizaFromBillingById = async (req, res) => {
  try {
    const ariza = await Ariza.findById(req.params.ariza_id);
    if (!ariza)
      return res.status(404).json({
        ok: false,
        message: "Ariza topilmadi",
      });

    const acts = (
      await tozaMakonApi.get("/billing-service/acts", {
        params: {
          residentId: ariza.aktInfo.residentId,
        },
      })
    ).data.content;
    const act = acts.find((a) => a.id == ariza.akt_id);
    const updates = {
      actStatus: act.actStatus,
      aktInfo: act,
    };
    if (act.actStatus === "CONFIRMED") updates.status = "tasdiqlangan";
    await ariza.updateOne(
      {
        $set: updates,
      },
      { new: true }
    );
    console.log(act);
    res.json({
      ok: true,
      ariza,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ ok: false, message: `internal error: ${error.message}` });
  }
};

module.exports.changeArizaAct = async (req, res) => {
  try {
    const { ariza_id } = req.params;
    const { allAmount, inhabitantCount } = req.body;
    const ariza = await Ariza.findById(ariza_id);
    if (!ariza)
      return res.status(404).json({
        ok: false,
        message: "Ariza topilmadi",
      });
    if (ariza.actStatus === "WARNED" || ariza.actStatus === "NEW") {
      const kSaldo = (
        await tozaMakonApi.get("billing-service/acts/calculate-k-saldo", {
          params: {
            amount: allAmount,
            residentId: ariza.aktInfo.residentId,
            actPackId: ariza.aktInfo.actPackId,
            actType: Number(allAmount) > 0 ? "CREDIT" : "DEBIT",
            inhabitantCount,
          },
        })
      ).data;
      const act = await tozaMakonApi.put("/billing-service/acts", {});
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: "Internal server error" });
  }
};
