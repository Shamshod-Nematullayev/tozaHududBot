const { createTozaMakonApi } = require("../../api/tozaMakon");
const { Act } = require("../../models/Act");
const { User } = require("../../models/User");

module.exports.getActs = async (req, res) => {
  try {
    const { page, actPackId } = req.query;
    let companyId = req.user.companyId;
    const user = await User.findById(req.user.id);
    if (user.roles.includes("admin")) {
      companyId = req.query.companyId;
    }
    const tozaMakonApi = createTozaMakonApi(companyId);
    const filters = {};
    if (actPackId) filters.actPackId = actPackId;

    const { data } = await tozaMakonApi.get("/billing-service/acts", {
      params: {
        actPackId,
        page,
        size,
      },
    });

    const acts = Act.find(filters);
    const actMap = new Map(acts.map((act) => [act.actId, act]));

    const merged = data.content.map((item) => ({
      ...item,
      onDb: actMap.get(item.id) || {}, // actId mos kelganini qo‘shamiz
    }));

    res.json(merged);
  } catch (error) {
    res.json({ ok: false, message: "Internal server error 500" });
  }
};

module.exports.getActById = async (req, res) => {
  try {
    const { id } = req.params;
    let companyId = req.user.companyId;
    const user = await User.findById(req.user.id);
    if (user.roles.includes("admin")) {
      companyId = req.query.companyId;
    }
    const tozaMakonApi = createTozaMakonApi(req.user.companyId);
    const { data } = await tozaMakonApi.get(`/billing-service/acts/${id}`);
    const act = await Act.findOne({ actId: data.id });
    if (act) {
      data.onDb = act;
    }
    res.json(data);
  } catch (error) {
    res.json({ ok: false, message: "Internal server error 500" });
  }
};


// controllers/act.controller.js

const { Act } = require("../models/act.model");

exports.checkById = async (req, res) => {
  try {
    const actId = req.params.id;
    const {
      checkedBy,
      fixedSum,
      status,
      warningMessage,
      comment
    } = req.body;

    // status faqat quyidagilardan bo'lishi kerak
    const allowedStatuses = ["ogohlantirildi", "tuzatildi", "bekor_qilindi"];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ error: "Noto‘g‘ri status qiymati." });
    }

    const act = await Act.findById(actId);
    if (!act) {
      return res.status(404).json({ error: "Akt topilmadi." });
    }

    // Logga yozamiz
    const logEntry = {
      actions: `Status: ${act.status} ➝ ${status}`,
      user: checkedBy,
      date: new Date(),
      comment: comment || "",
    };

    // Yangilaymiz
    act.checkedAt = new Date();
    act.checkedBy = checkedBy;
    act.fixedSum = fixedSum ?? act.fixedSum;
    act.status = status;
    act.warningMessage = warningMessage ?? act.warningMessage;
    act.logs.push(logEntry);

    await act.save();

    res.json({ message: "Akt muvaffaqiyatli yangilandi", act });
  } catch (error) {
    console.error("Xatolik:", error);
    res.status(500).json({ error: "Ichki server xatoligi" });
  }
};
