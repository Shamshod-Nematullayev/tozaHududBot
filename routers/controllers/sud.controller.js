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
