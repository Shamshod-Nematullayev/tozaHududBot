const { SudAkt } = require("../../models/SudAkt");
const { Counter } = require("../../requires");

module.exports.getSudAkts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortField = "sana",
      sortDirection = "asc",
      status,
      account_number,
      warning_date_from,
      warning_date_to,
      claim_amount_from,
      claim_amount_to,
      case_number,
    } = req.query;
    const skip = (page - 1) * limit;
    const sortOptions = {};
    sortOptions[sortField] = sortDirection === "asc" ? 1 : -1;
    const filters = {};

    if (status) filters.status = status;
    if (account_number) filters.licshet = account_number;
    if (warning_date_from)
      filters.warningDate = { $gte: new Date(warning_date_from) };
    if (warning_date_to)
      filters.warningDate = {
        ...filters.warningDate,
        $lte: new Date(warning_date_to),
      };
    if (claim_amount_from)
      filters.claimAmount = { $gte: parseFloat(claim_amount_from) };
    if (claim_amount_to)
      filters.claimAmount = {
        ...filters.claimAmount,
        $lte: parseFloat(claim_amount_to),
      };
    if (case_number) filters.sud_case_number = case_number;

    const data = await SudAkt.find(filters)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();
    const totalCount = await SudAkt.countDocuments(filters);
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
    console.error(error.message);
    res.status(500).json({ ok: false, message: "Internal Server Error" });
  }
};

module.exports.getCourtCaseBySudAktId = async (req, res) => {
  try {
    const sudAkt = await SudAkt.findById(req.params._id);
    if (!sudAkt)
      return res.status(404).json({
        ok: false,
        message: "Data not found",
      });
    let data = await fetch(
      "https://cabinetapi.sud.uz/api/cabinet/case/civil/all-cases?size=30&page=0&withCreated=true&case_number=2-1402-2406/1059",
      {
        headers: {
          accept: "application/json, text/plain, */*",
          "accept-language": "en-GB,en-US;q=0.9,en;q=0.8,uz;q=0.7,ru;q=0.6",
          "content-type": "application/json",
          responsetype: "arraybuffer",
          "sec-ch-ua":
            '"Chromium";v="134", "Not:A-Brand";v="24", "Google Chrome";v="134"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"Windows"',
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-site",
          "x-auth-token": "1435fdf8-eafa-4edd-b746-aa9a3495bfd7",
        },
        referrer: "https://cabinet.sud.uz/",
        referrerPolicy: "strict-origin-when-cross-origin",
        body: null,
        method: "GET",
        mode: "cors",
        credentials: "omit",
      }
    );
    data = (await data.json()).content;
    const courtCase = data.find(
      (a) => a.case_number === sudAkt.sud_case_number
    );
    res.json({
      ok: true,
      data: courtCase,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, message: "Interval Server Error" });
  }
};

module.exports.getOneSudAkt = async (req, res) => {
  try {
    const filters = req.body;
    const data = await SudAkt.findOne(filters);
    if (!data) {
      return res.status(404).json({
        ok: false,
        message: "not found",
      });
    }
    res.json({
      ok: true,
      data,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      ok: false,
      message: "Internal server error",
    });
  }
};

module.exports.searchByLicshetSudakt = async (req, res) => {
  try {
    const { licshet } = req.query;
    if (!licshet) {
      return res.json({ ok: false, message: "Licshet kiritilmadi" });
    }
    const results = await SudAkt.countDocuments({
      licshet: new RegExp(licshet),
      $or: [{ status: "yangi" }, { status: "ariza_yaratildi" }],
    });
    if (results > 30) {
      return res.json({ ok: false, message: "Juda ko'p natijalar aniqlandi" });
    }
    const sudAkts = await SudAkt.find({
      licshet: new RegExp(licshet),
      $or: [{ status: "yangi" }, { status: "ariza_yaratildi" }],
    });
    res.json({ ok: true, rows: sudAkts });
  } catch (error) {
    res.json({ ok: false, message: "Internal server error 500" });
    console.error(error);
  }
};

module.exports.createSudAriza = async (req, res) => {
  try {
    const sudAkt = await SudAkt.findById(req.params._id);
    if (!sudAkt) {
      return res.json({ ok: false, message: "SudAkt topilmadi" });
    }

    const { ariza_date, ariza_type } = req.body;
    if (!ariza_date || !ariza_type) {
      return res.json({
        ok: false,
        message: "Ariza tartib raqami yoki turi kiritilmadi",
      });
    }
    const counter = await Counter.findOne({
      name: "sudga_ariza_tartib_raqami",
    });
    await sudAkt.updateOne({
      $set: {
        ariza_order_num: counter.value + 1,
        ariza_date,
        ariza_type,
        status: "ariza_yaratildi",
      },
    });
    await counter.updateOne({ $set: { value: counter.value + 1 } });
    res.json({
      ok: true,
      sudAkt,
      ariza_order_num: counter.value,
      message: "Ariza tartib raqami qo'shildi",
    });
  } catch (error) {
    res.json({ ok: false, message: "Internal server error 500" });
    console.error(error);
  }
};

module.exports.createManySudAriza = async (req, res) => {
  try {
    const { sudAktIds, ariza_date, ariza_type } = req.body;
    if (!sudAktIds || sudAktIds.length === 0) {
      return res.json({ ok: false, message: "SudAkt idlari kiritilmadi" });
    }

    if (!ariza_date || !ariza_type) {
      return res.json({
        ok: false,
        message: "Ariza sanasi yoki turi kiritilmadi",
      });
    }
    if (!SudAkt.schema.paths.ariza_type.options.enum.includes(ariza_type)) {
      return res.json({
        ok: false,
        message: "Ariza turi mavjud emas",
      });
    }
    const sudAkts = await SudAkt.find({ _id: { $in: sudAktIds } });
    if (sudAkts.length !== sudAktIds.length) {
      return res.json({ ok: false, message: "SudAkt topilmadi" });
    }
    const counter = await Counter.findOne({
      name: "sudga_ariza_tartib_raqami",
    });
    const updatedSudAkts = [];
    for (const sudAkt of sudAkts) {
      if (sudAkt.status === "yangi") {
        const newOrderNum = counter.value + updatedSudAkts.length + 1;
        await sudAkt.updateOne({
          $set: {
            ariza_order_num: newOrderNum,
            ariza_date: ariza_date,
            ariza_type: ariza_type,
            status: "ariza_yaratildi",
          },
        });
        updatedSudAkts.push({
          ...sudAkt.toObject(),
          ariza_order_num: newOrderNum,
          status: "ariza_yaratildi",
        });
        await counter.updateOne({ $set: { value: newOrderNum } });
      } else {
        updatedSudAkts.push(sudAkt.toObject());
      }
    }
    return res.json({ ok: true, rows: updatedSudAkts });
  } catch (error) {
    res.json({ ok: false, message: "Internal server error 500" });
    console.error(error);
  }
};

module.exports.uploadSudArizaFile = async (req, res) => {
  try {
    const { file } = req;
    const { sud_akt_id } = req.body;
    if (!file) {
      return res.json({ ok: false, message: "File not found" });
    }
    if (!file.mimetype.startsWith("application/pdf")) {
      return res.json({
        ok: false,
        message: "Invalid file format. Please upload a PDF file",
      });
    }
    if (!sud_akt_id) {
      return res.json({ ok: false, message: "SudAkt id not found" });
    }
    const sud_akt = await SudAkt.findById(sud_akt_id);
    const blobName = `ariza-file-${Date.now()}-${file.originalname}`;
    const telegram_res = await bot.telegram.sendDocument(
      process.env.TEST_BASE_CHANNEL_ID,
      {
        source: file.buffer,
        filename: blobName,
      }
    );
    await sud_akt.updateOne({
      $set: {
        ariza_file_id: telegram_res.document.file_id,
        ariza_file_name: blobName,
        status: "ariza_imzolandi",
      },
    });

    res.json({ ok: true, message: "Muvaffaqqiyatli yuklandi" });
  } catch (err) {
    res.json({ ok: false, message: "Internal server error 500" });
    console.error(err);
  }
};
