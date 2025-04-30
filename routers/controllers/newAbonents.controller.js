const { NewAbonent } = require("../../models/NewAbonents");

module.exports.getPendingNewAbonents = async (req, res) => {
  try {
    const { companyId } = req.user;
    const { page, limit } = req.query;
    const skip = (page - 1) * limit;
    const count = await NewAbonent.countDocuments({
      status: "pending",
      id: companyId,
    });
    const pendingNewAbonents = await NewAbonent.find({
      status: "pending",
      id: companyId,
    })
      .skip(skip)
      .limit(limit);
    res.json({ ok: true, count, pendingNewAbonents });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, error: "Server error " + error.message });
  }
};
