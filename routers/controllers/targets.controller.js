const { bot } = require("../../core/bot");
const { Bildirishnoma } = require("../../models/SudBildirishnoma");
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

module.exports.createDocumentTargets = async (req, res) => {
  try {
    const { targets, abonents, inspector, mahallaId } = req.body;
    if (!targets || targets.length === 0 || !inspector || !mahallaId) {
      return res
        .status(400)
        .json({ ok: false, message: "All fields are required" });
    }
    const lastDocument = await Bildirishnoma.findOne({
      type: "sudga_chiqoring",
    }).sort({ doc_num: -1 });
    const doc_num = lastDocument ? lastDocument.doc_num + 1 : 1;
    const document = await Bildirishnoma.create({
      type: "sudga_chiqoring",
      doc_num,
      abonents,
      targets,
      inspector: {
        name: inspector.name,
        id: inspector.id,
      },
      date: new Date(),
      mahallaId,
      user: {
        _id: req.user.id,
        username: req.user.login,
      },
    });
    res
      .status(201)
      .json({ ok: true, message: "Targets created successfully", document });
    targets.forEach(async (target) => {
      await Target.findByIdAndUpdate(target, {
        $set: { document_id: document._id, status: "xujjat_yaratildi" },
      });
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ ok: false, message: "Internal Server Error" });
  }
};

module.exports.signDocumentTargets = async (req, res) => {
  try {
    const { document_id } = req.params;
    if (!document_id) {
      return res
        .status(400)
        .json({ ok: false, message: "Document ID required" });
    }
    if (!req.file) {
      return res.status(400).json({ ok: false, message: "File required" });
    }
    // upload file to telegram
    const ctx = await bot.telegram.sendDocument(
      process.env.TEST_BASE_CHANNEL_ID,
      {
        source: req.file.buffer,
      }
    );
    // updateDocument
    const document = await Bildirishnoma.findByIdAndUpdate(document_id, {
      $set: { file_id: ctx.document.file_id },
    });
    // res.send
    res.status(200).json({
      ok: true,
      message: "Document signed successfully",
    });
    // updateTargets
    document.targets?.forEach(async (target) => {
      await Target.findByIdAndUpdate(target, {
        $set: { status: "tasdiqlandi" },
      });
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ ok: false, message: "Internal Server Error" });
  }
};

module.exports.getDocumentTargetsById = async (req, res) => {
  try {
    const document = await Bildirishnoma.findById(req.params._id);
    if (!document) {
      return res.status(404).json({ ok: false, message: "Document not found" });
    }
    res.status(200).json({ ok: true, document });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ ok: false, message: "Internal Server Error" });
  }
};

module.exports.getDocumentTargets = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 30,
      doc_num,
      mahallaId,
      inspector_id,
      status,
    } = req.query;
    const skip = (page - 1) * limit;
    const filters = {};
    if (doc_num) filters.doc_num = doc_num;
    if (mahallaId) filters.mahallaId = mahallaId;
    if (inspector_id) filters["inspector.id"] = inspector_id;
    if (status) filters.status = status;
    const documents = await Bildirishnoma.find(filters)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    const totalCount = await Bildirishnoma.countDocuments({
      ...filters,
      type: "sudga_chiqoring",
    });
    res.status(200).json({
      data: documents,
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
