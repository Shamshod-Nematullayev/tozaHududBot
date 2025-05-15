const { Abonent, Nazoratchi } = require("../../requires");
const { Types } = require("mongoose");

module.exports.getConfirmedAbonentCountsReportByInspectors = async (
  req,
  res
) => {
  try {
    const inspectors = await Nazoratchi.find({
      companyId: req.user.companyId,
    })
      .select(["name", "_id", "id"])
      .lean()
      .limit(5);
    const { fromDate, toDate } = req.query;
    const result = [];
    for (const inspector of inspectors) {
      inspector.pnflConfirmed = await Abonent.countDocuments({
        "shaxsi_tasdiqlandi.confirm": true,
        $or: [
          { "shaxsi_tasdiqlandi.inspector._id": inspector._id },
          {
            "shaxsi_tasdiqlandi.inspector._id": new Types.ObjectId(
              inspector._id
            ),
          },
        ],
        companyId: req.user.companyId,
      });
      inspector.etkConfirmed = await Abonent.countDocuments({
        "ekt_kod_tasdiqlandi.confirm": true,
        $or: [
          { "ekt_kod_tasdiqlandi.inspector._id": inspector._id },
          {
            "ekt_kod_tasdiqlandi.inspector._id": new Types.ObjectId(
              inspector._id
            ),
          },
        ],
        companyId: req.user.companyId,
      });
      let filters = {
        companyId: req.user.companyId,
        $or: [
          { "shaxsi_tasdiqlandi.inspector._id": inspector._id },
          {
            "shaxsi_tasdiqlandi.inspector._id": new Types.ObjectId(
              inspector._id
            ),
          },
        ],
      };
      if (fromDate) {
        filters.shaxsi_tasdiqlandi.updated_at = {
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
        $or: [
          { "ekt_kod_tasdiqlandi.inspector._id": inspector._id },
          {
            "ekt_kod_tasdiqlandi.inspector._id": new Types.ObjectId(
              inspector._id
            ),
          },
        ],
      };
      if (fromDate) {
        filters.ekt_kod_tasdiqlandi.updated_at = {
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
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    console.error(error);
  }
};
