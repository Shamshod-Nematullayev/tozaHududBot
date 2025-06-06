const { createTozaMakonApi } = require("../../api/tozaMakon");
const { Act } = require("../../models/Act");
const { Admin } = require("../../requires");

module.exports.getActPacks = async (req, res) => {
  try {
    let companyId = req.user.companyId;
    const {
      period = `${new Date().getMonth() + 1}.${new Date().getFullYear()}`,
    } = req.query;
    const tozaMakonApi = createTozaMakonApi(companyId);
    const { data } = await tozaMakonApi.get("/billing-service/act-packs", {
      params: {
        period,
      },
    });
    const acts = await Act.find({ period, companyId }).select("actPackId");
    data.content.forEach((pack) => {
      pack.checkedCount = acts.filter((act) => act.actPackId == pack.id).length;
      pack.notCheckedCount = pack.actsCount - pack.checkedCount;
    });
    res.json(data.content);
  } catch (error) {
    res.json({ ok: false, message: "Internal server error 500" });
  }
};

module.exports.getActStats = async (req, res) => {
  try {
    let companyId = req.user.companyId;
    const date = new Date();
    const { period = `${date.getMonth() + 1}.${date.getFullYear()}` } =
      req.query;
    const tozaMakonApi = createTozaMakonApi(companyId);
    const { data } = await tozaMakonApi.get("/billing-service/act-packs", {
      params: { period },
    });
    const warnedActsCount = await Act.countDocuments({
      status: "ogohlantirildi",
      period,
      companyId,
    });
    const rejectedActsCount = await Act.countDocuments({
      status: "bekor_qilindi",
      period,
      companyId,
    });
    const checkedActsCount = await Act.countDocuments({
      status: "tekshirildi",
      period,
      companyId,
    });
    const packs = data.content;

    res.json({
      warnedActsCount,
      rejectedActsCount,
      checkedActsCount,
      newActsCount:
        packs.reduce((acc, pack) => acc + pack.actsCount, 0) -
        (warnedActsCount + rejectedActsCount + checkedActsCount),
    });
  } catch (error) {
    res.json({ ok: false, message: "Internal server error 500" });
  }
};
module.exports.getActs = async (req, res) => {
  try {
    let companyId = req.user.companyId;
    const { packId, page = 0, size = 100, status, checkStatus } = req.query;

    const tozaMakonApi = createTozaMakonApi(companyId);
    const filters = {};
    if (packId) filters.actPackId = packId;

    const data = (
      await tozaMakonApi.get("/billing-service/acts", {
        params: {
          actPackId: packId,
          page,
          size,
          actStatus: status,
        },
      })
    ).data;

    let content = [];

    if (checkStatus) {
      const { data } = await tozaMakonApi.get("/billing-service/acts", {
        params: {
          actPackId: packId,
          page,
          size: 500,
          actStatus: status,
        },
      });
      const ids = data.content.map((act) => act.id);
      const acts = await Act.find({ actId: { $in: ids } });
      console.log(acts.length, ids.length, ids);
      const actMap = new Map(acts.map((act) => [act.actId, act]));
      data.content.forEach((item) => {
        const onDb = actMap.get(item.id);
        if (onDb && onDb.status == checkStatus) {
          content.push({ ...item, onDb });
        }
        if (checkStatus == "yangi" && !onDb) {
          content.push({ ...item });
        }
      });
    } else {
      content = data.content;
    }

    const acts = await Act.find(filters);
    const actMap = new Map(acts.map((act) => [act.actId, act]));

    const merged = content.map((item) => ({
      ...item,
      onDb: actMap.get(item.id) || {}, // actId mos kelganini qo‘shamiz
    }));

    res.json({
      content: merged,
      totalElements: data.totalElements,
      totalPages: data.totalPages,
    });
  } catch (error) {
    res.json({ ok: false, message: "Internal server error 500" });
    console.error(error.message);
  }
};

module.exports.getActById = async (req, res) => {
  try {
    const { id } = req.params;
    let companyId = req.user.companyId;
    const tozaMakonApi = createTozaMakonApi(companyId);
    const data = (
      await tozaMakonApi.get(`/billing-service/acts`, {
        params: {
          id,
        },
      })
    ).data.content[0];
    const act = await Act.findOne({ actId: data.id });
    if (act) {
      data.onDb = act;
    }
    res.json(data);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({
      ok: false,
      error: "Internal server error 500",
      message: error.response?.data?.message,
    });
  }
};

exports.checkActById = async (req, res) => {
  try {
    const actId = req.params.id;
    const {
      fixedSum,
      status,
      warningMessage,
      comment,
      actPackId,
      companyId,
      period,
    } = req.body;

    // status faqat quyidagilardan bo'lishi kerak
    const allowedStatuses = [
      "ogohlantirildi",
      "tuzatildi",
      "bekor_qilindi",
      "tekshirildi",
    ];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        error: "Noto‘g‘ri status qiymati.",
        message:
          "Status faqat quyidagilardan bo'lishi kerak: ogohlantirildi, tuzatildi, bekor_qilindi, tekshirildi.",
      });
    }

    // period formati: 1.2025
    if (/^\d+\.\d{4}$/.test(period))
      if (!actPackId || isNaN(actPackId)) {
        return res.status(400).json({
          error: "Noto‘g‘ri actPackId formati. Raqam bo'lishi kerak.",
        });
      }

    const act = await Act.findOne({ actId });

    console.log(req.user);
    if (!act) {
      const newAct = new Act({
        actId,
        checkedBy: req.user.fullName,
        fixedSum,
        status,
        warningMessage,
        comment,
        checkedAt: new Date(),
        actPackId,
        period,
        companyId,
      });

      await newAct.save();
      return res.json({ message: "Yangi akt qo'shildi", act: newAct });
    }

    // Logga yozamiz
    const logEntry = {
      actions: `Status: ${act.status || "yangi"} ➝ ${status}`,
      user: req.user.fullName,
      date: new Date(),
      comment: comment || "",
    };
    // Yangilaymiz
    act.checkedAt = new Date();
    act.checkedBy = req.user.fullName;
    act.fixedSum = fixedSum ?? act.fixedSum;
    act.status = status;
    act.warningMessage = warningMessage ?? act.warningMessage;
    act.logs.push(logEntry);

    await act.save();

    res.json({ message: "Akt muvaffaqiyatli yangilandi", act });
  } catch (error) {
    console.error("Xatolik:", error);
    res.status(500).json({ message: "Ichki server xatoligi" });
  }
};

module.exports.getPdfByFileId = async (req, res) => {
  try {
    const fileId = req.query.fileId;

    const tozaMakonApi = createTozaMakonApi(req.user.companyId);
    const { data } = await tozaMakonApi.get(`/file-service/buckets/download`, {
      params: { file: fileId },
      responseType: "arraybuffer",
      params: {
        file: fileId,
      },
    });
    res.set("Content-Type", "application/pdf");
    res.send(data);
  } catch (error) {
    console.error("Xatolik: ", error);
    res.status(500).json({ message: "Ichki server xatoligi" });
  }
};

module.exports.addLogToAct = async (req, res) => {
  try {
    const { actId, log } = req.body;
    if (!log) {
      return res.status(400).json({ error: "Log not found" });
    }
    const user = await Admin.findById(req.user.id);
    const logEntry = {
      actions: log.actions,
      user: user.fullName,
      date: new Date(),
      comment: log.comment || "",
    };
    const act = await Act.findOne({ actId });
    if (!act) {
      return res.status(404).json({ error: "Act not found" });
    }
    act.logs.push(logEntry);
    await act.save();
    res.json({ message: "Log muvaffaqiyatli qo'shildi", act });
  } catch (error) {
    console.error("Xatolik: ", error);
    res.status(500).json({ message: "Ichki server xatoligi" });
  }
};

module.exports.calculateAmount = async (req, res) => {
  try {
    const {
      residentId,
      actPackId,
      startPeriod,
      endPeriod,
      kSaldo = 0,
      inhabitantCount,
    } = req.query;

    const tozaMakonApi = createTozaMakonApi(req.user.companyId);

    const { data } = await tozaMakonApi.get(
      `/billing-service/acts/calculate-amount`,
      {
        params: {
          residentId,
          actPackId,
          startPeriod,
          endPeriod,
          kSaldo,
          inhabitantCount,
        },
      }
    );
    res.json(data);
  } catch (error) {
    console.error("Xatolik: ", error);
    res.status(500).json({
      message: "Ichki server xatoligi",
      message: error.response?.data?.message,
    });
  }
};
