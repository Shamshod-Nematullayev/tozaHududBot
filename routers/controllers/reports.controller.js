const { Abonent, Nazoratchi } = require("../../requires");

module.exports.getConfirmedAbonentCountsReportByInspectors = async (
  req,
  res
) => {
  try {
    const inspectors = await Nazoratchi.find({
      companyId: req.user.companyId,
    })
      .select(["name", "_id", "id"])
      .lean();
    const { fromDate = new Date(2025, 4, 1), toDate } = req.query;
    const result = [];
    const promises = inspectors.map(async (inspector) => {
      inspector.pnflConfirmed = await Abonent.countDocuments({
        "shaxsi_tasdiqlandi.confirm": true,
        "shaxsi_tasdiqlandi.inspector._id": inspector._id,
        companyId: req.user.companyId,
      });
      inspector.etkConfirmed = await Abonent.countDocuments({
        "ekt_kod_tasdiqlandi.confirm": true,
        "ekt_kod_tasdiqlandi.inspector._id": inspector._id,

        companyId: req.user.companyId,
      });
      let filters = {
        companyId: req.user.companyId,
        "shaxsi_tasdiqlandi.inspector._id": inspector._id,
      };
      if (fromDate) {
        filters["shaxsi_tasdiqlandi.updated_at"] = {
          $gte: new Date(fromDate),
        };
      }
      if (toDate) {
        filters.shaxsi_tasdiqlandi.updated_at = {
          ...filters.shaxsi_tasdiqlandi.updated_at,
          $lte: new Date(toDate),
        };
      }
      inspector.pnflConfirmedByDate = await Abonent.countDocuments(filters);
      filters = {
        companyId: req.user.companyId,
        "ekt_kod_tasdiqlandi.inspector._id": inspector._id,
      };
      if (fromDate) {
        filters["ekt_kod_tasdiqlandi.updated_at"] = {
          $gte: new Date(fromDate),
        };
      }
      if (toDate) {
        filters.ekt_kod_tasdiqlandi.updated_at = {
          ...filters.ekt_kod_tasdiqlandi.updated_at,
          $lte: new Date(toDate),
        };
      }
      inspector.etkConfirmedByDate = await Abonent.countDocuments(filters);
      result.push(inspector);
    });
    await Promise.all(promises);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    console.error(error);
  }
};
