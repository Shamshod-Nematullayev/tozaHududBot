const { NewAbonent, StatusNewAbonent } = require("../../models/NewAbonents");
const { bot } = require("../../core/bot");
const { createTozaMakonApi } = require("../../api/tozaMakon");
const { Nazoratchi, Abonent } = require("../../requires");

module.exports.getPendingNewAbonents = async (req, res) => {
  try {
    const { companyId } = req.user;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const skip = (page - 1) * limit;
    console.log(page, limit, skip, companyId, StatusNewAbonent.PENDING);
    const count = await NewAbonent.countDocuments({
      status: StatusNewAbonent.PENDING,
      companyId: companyId,
    });
    const pendingNewAbonents = await NewAbonent.find({
      status: StatusNewAbonent.PENDING,
      companyId: companyId,
    })
      .skip(skip)
      .limit(limit);
    res.json({ ok: true, count, pendingNewAbonents });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ ok: false, message: "Server error " + error.message });
  }
};

module.exports.getOnePendingNewAbonent = async (req, res) => {
  try {
    const pendingAbonent = await NewAbonent.findOne({
      companyId: req.user.companyId,
      _id: req.params._id,
    });
    if (!pendingAbonent) {
      return res.status(404).json({ ok: false, message: "Abonent not found" });
    }
    res.json({ ok: true, data: pendingAbonent });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ ok: false, message: "Server error " + error.message });
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
        .json({ ok: false, message: "Description is required" });
    }
    const pendingAbonent = await NewAbonent.findOneAndUpdate(
      { _id, companyId },
      { status: StatusNewAbonent.REJECTED, description },
      { new: true }
    );
    if (!pendingAbonent) {
      return res.status(404).json({ ok: false, message: "Abonent not found" });
    }
    res.json({ ok: true, data: pendingAbonent });
    bot.sendMessage(
      pendingAbonent.senderId,
      `Fuqaro: ${pendingAbonent.citizen.lastName} ${pendingAbonent.citizen.firstName} ${pendingAbonent.citizen.patronymic}\nSizning ushbu fuqaroga yangi abonent ochish haqidagi arizangiz bekor qilindi. \n\nSababi: ${description}`
    );
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ ok: false, message: "Server error " + error.message });
  }
};

module.exports.acceptPendingNewAbonent = async (req, res) => {
  try {
    const { _id } = req.params;
    const { companyId } = req.user;
    const pendingAbonent = await NewAbonent.findOne({ _id, companyId });
    if (!pendingAbonent) {
      return res.status(404).json({ ok: false, message: "Abonent not found" });
    }
    const nazoratchi = await Nazoratchi.findOne({
      companyId,
      id: pendingAbonent.nazoratchi_id,
    });
    if (!nazoratchi) {
      return res
        .status(404)
        .json({ ok: false, message: "Nazoratchi not found" });
    }
    const tozaMakonApi = createTozaMakonApi(req.user.companyId);
    const generatedAccountNumber = (
      await tozaMakonApi.get(
        `/user-service/residents/account-numbers/generate?residentType=INDIVIDUAL&mahallaId=${pendingAbonent.mahallaId}`
      )
    ).data;
    const { data } = await tozaMakonApi.post("/user-service/residents", {
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
    await Abonent.create({
      createdAt: new Date(),
      fio: pendingAbonent.abonent_name,
      licshet: generatedAccountNumber,
      mahallas_id: pendingAbonent.mahallaId,
      prescribed_cnt: pendingAbonent.inhabitant_cnt,
      id: data,
      kadastr_number: pendingAbonent.cadastr,
      pinfl: pendingAbonent.citizen.pnfl,
      mahalla_name: pendingAbonent.mahallaName,
      passport_number: pendingAbonent.citizen.passport,
      streets_id: pendingAbonent.streetId,
      shaxsi_tasdiqlandi: {
        confirm: true,
        inspector: {
          _id: nazoratchi._id,
          name: nazoratchi.name,
        },
        inspector_id: nazoratchi.id,
        inspector_name: nazoratchi.name,
      },
      companyId: pendingAbonent.companyId,
    });
    await pendingAbonent.updateOne({
      status: StatusNewAbonent.ACCEPTED,
      accountNumber: generatedAccountNumber,
    });

    res.json({ ok: true, data: pendingAbonent });
    bot.telegram.sendMessage(
      pendingAbonent.senderId,
      `Fuqaro: ${pendingAbonent.citizen.lastName} ${pendingAbonent.citizen.firstName} ${pendingAbonent.citizen.patronymic}\nSizning ushbu fuqaroga yangi abonent ochish haqidagi arizangiz qabul qilindi. \n\nSizning yangi abonent raqamingiz: <code>${generatedAccountNumber}</code>`,
      { parse_mode: "HTML" }
    );
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ ok: false, message: "Server error " + error.message });
  }
};
