const { Target } = require("../../models/TargetAbonent");

module.exports.getTargets = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 30,
      accountNumber,
      mahalla_id,
      inspector_id,
      status,
    } = req.query;
    const skip = (page - 1) * limit;
    const filters = {};
    if (accountNumber) filters.accountNumber = accountNumber;
    if (mahalla_id) filters.mahalla_id = mahalla_id;
    if (inspector_id) filters.inspector_id = inspector_id;
    if (status) filters.status = status;
    const targets = await Target.find(filters)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    const totalCount = await Target.countDocuments(filters);
    res.status(200).json({
      data: targets,
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
