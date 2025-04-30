const { NewAbonent, StatusNewAbonent } = require("../../models/NewAbonents");
const { bot } = require("../../core/bot");
const { createTozaMakonApi } = require("../../api/tozaMakon");
const { Nazoratchi } = require("../../requires");

module.exports.getPendingNewAbonents = async (req, res) => {
  try {
    const { companyId } = req.user;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const skip = (page - 1) * limit;
    const count = await NewAbonent.countDocuments({
      status: StatusNewAbonent.PENDING,
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

module.exports.getOnePendingNewAbonent = async (req, res) => {
  try {
    const pendingAbonent = await NewAbonent.findOne({
      companyId: req.user.companyId,
      _id: req.params._id,
    });
    if (!pendingAbonent) {
      return res.status(404).json({ ok: false, error: "Abonent not found" });
    }
    res.json({ ok: true, data: pendingAbonent });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, error: "Server error " + error.message });
  }
};

module.exports.cancelPendingNewAbonent = async (req, res) => {
  try {
    const { _id } = req.params;
    const { companyId } = req.user;
    const { description } = req.body;
    if (!description) {
      return res
        .status(400)
        .json({ ok: false, error: "Description is required" });
    }
    const pendingAbonent = await NewAbonent.findOneAndUpdate(
      { _id, companyId },
      { status: StatusNewAbonent.REJECTED, description },
      { new: true }
    );
    if (!pendingAbonent) {
      return res.status(404).json({ ok: false, error: "Abonent not found" });
    }
    res.json({ ok: true, data: pendingAbonent });
    bot.sendMessage(
      pendingAbonent.senderId,
      `Fuqaro: ${pendingAbonent.citizen.lastName} ${pendingAbonent.citizen.firstName} ${pendingAbonent.citizen.patronymic}\nSizning ushbu fuqaroga yangi abonent ochish haqidagi arizangiz bekor qilindi. \n\nSababi: ${description}`
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, error: "Server error " + error.message });
  }
};

module.exports.acceptPendingNewAbonent = async (req, res) => {
  try {
    const { _id } = req.params;
    const { companyId } = req.user;
    const pendingAbonent = await NewAbonent.findOneAndUpdate(
      { _id, companyId },
      { status: StatusNewAbonent.APPROVED },
      { new: true }
    );
    if (!pendingAbonent) {
      return res.status(404).json({ ok: false, error: "Abonent not found" });
    }
    const nazoratchi = await Nazoratchi.findOne({
      companyId,
      id: pendingAbonent.nazoratchi_id,
    });
    if (!nazoratchi) {
      return res.status(404).json({ ok: false, error: "Nazoratchi not found" });
    }
    const tozaMakonApi = createTozaMakonApi(req.user.companyId);
    const generatedAccountNumber = (
      await tozaMakonApi.get(
        `/user-service/residents/account-numbers/generate?residentType=INDIVIDUAL&mahallaId=${pendingAbonent.mahallaId}`
      )
    ).data;
    const { data } = await tozaMakonApi.post("/abonents", {
      accountNumber: generatedAccountNumber,
      active: true,
      citizen: pendingAbonent.citizen,
      companyId: pendingAbonent.companyId,
      contractDate: null,
      contractNumber: null,
      description: `${nazoratchi.name} tomonidan yangi abonent ochish uchun ariza qabul qilindi`,
      electricityAccountNumber: pendingAbonent.etkCustomerCode,
      electricityCoato: pendingAbonent.etkCaoto,
      homePhone: null,
      house: {
        cadastralNumber: pendingAbonent.cadastr,
        flatNumber: null,
        homeIndex: null,
        homeNumber: 0,
        inhabitantCnt: pendingAbonent.inhabitant_cnt,
        temporaryCadastralNumber: null,
        type: "HOUSE",
      },
      isCreditor: false,
      mahallaId: pendingAbonent.mahallaId,
      nSaldo: 0,
      residentType: "INDIVIDUAL",
      streetId: pendingAbonent.streetId,
    });
    res.json({ ok: true, data: pendingAbonent });
    bot.sendMessage(
      pendingAbonent.senderId,
      `Fuqaro: ${pendingAbonent.citizen.lastName} ${pendingAbonent.citizen.firstName} ${pendingAbonent.citizen.patronymic}\nSizning ushbu fuqaroga yangi abonent ochish haqidagi arizangiz qabul qilindi. \n\nSizning yangi abonent raqamingiz: <code>${pendingAbonent.accountNumber}</code>`
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, error: "Server error " + error.message });
  }
};
