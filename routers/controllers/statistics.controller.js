const { Abonent } = require("../../models/Abonent");
const { LastUpdate } = require("../../models/LastUpdate");

module.exports.getIdentityStat = async (req, res) => {
  try {
    const allAbonentsCount = await Abonent.countDocuments({
      companyId: req.user.companyId,
    });
    const confirmed = await Abonent.countDocuments({
      "shaxsi_tasdiqlandi.confirm": {
        $ne: true,
      },
      companyId: req.user.companyId,
    });
    res.json({
      allAbonentsCount,
      confirmed: allAbonentsCount - confirmed,
    });
    console.log(allAbonentsCount, confirmed, "id");
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    console.error(error);
  }
};

module.exports.getETKConfirmStat = async (req, res) => {
  try {
    const allAbonentsCount = await Abonent.countDocuments({
      companyId: req.user.companyId,
    });
    const confirmed = await Abonent.countDocuments({
      "ekt_kod_tasdiqlandi.confirm": {
        $ne: true,
      },
      companyId: req.user.companyId,
    });
    res.json({
      allAbonentsCount,
      confirmed: allAbonentsCount - confirmed,
    });
    console.log(allAbonentsCount, confirmed, "etk");
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    console.error(error);
  }
};

module.exports.getLastUpdateDateAbonentsSaldo = async (req, res) => {
  try {
    const lastUpdateDate = (
      await LastUpdate.findOne({ key: `abonents-update-${req.user.companyId}` })
    ).last_update;
    res.json({ lastUpdateDate });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    console.error(error);
  }
};
