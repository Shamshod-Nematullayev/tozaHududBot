const { SudAkt } = require("../../models/SudAkt");

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
