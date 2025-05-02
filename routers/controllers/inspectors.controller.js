const { Nazoratchi } = require("../../models/Nazoratchi");
const { Mahalla } = require("../../models/Mahalla");
const { createTozaMakonApi } = require("../../api/tozaMakon");

module.exports.getAllInspectors = async (req, res) => {
  try {
    console.log(req.user);
    const inspectors = await Nazoratchi.find({ companyId: req.user.companyId });
    const mahallalar = await Mahalla.find({
      reja: { $gt: 0 },
      companyId: req.user.companyId,
    });
    const rows = [];
    inspectors.forEach((person) => {
      const inspektor = {
        _id: person._id,
        id: person.id,
        name: person.name,
        biriktirilgan: [],
      };
      mahallalar.forEach((mfy) => {
        if (mfy.biriktirilganNazoratchi.inspactor_id > 0) {
          if (mfy.biriktirilganNazoratchi.inspactor_id == person.id) {
            inspektor.biriktirilgan.push({
              mfy_id: mfy.id,
              mfy_name: mfy.name,
            });
          }
        }
      });
      rows.push(inspektor);
    });
    rows.sort((a, b) => a.name.localeCompare(b.name));
    mahallalar.sort((a, b) => a.name.localeCompare(b.name));
    res.json({
      ok: true,
      rows,
      mahallalar,
    });
  } catch (error) {
    res.json({ ok: false, message: "Internal server error" });
    console.error(error.message);
  }
};

module.exports.setInspectorToMfy = async (req, res) => {
  try {
    const mfy = await Mahalla.findOne({ id: req.params.mfy_id });
    if (!mfy) return res.json({ ok: false, message: "Mahalla not found" });

    const inspector = await Nazoratchi.findOne({ id: req.body.inspector_id });
    await mfy.updateOne({
      $set: {
        biriktirilganNazoratchi: {
          inspector_name: inspector.name,
          inspactor_id: inspector.id,
        },
      },
    });
    res.json({ ok: true, message: "updated" });
  } catch (error) {
    console.error(error);
    res.json({ ok: false, message: "Internal server error" });
  }
};

module.exports.unsetInspectorToMfy = async (req, res) => {
  try {
    const mfy = await Mahalla.findOne({ id: req.params.mfy_id });
    if (!mfy) return res.json({ ok: false, message: "Mahalla not found" });

    await mfy.updateOne({
      $set: {
        biriktirilganNazoratchi: { inspector_name: null, inspactor_id: null },
      },
    });
    res.json({ ok: true, message: "updated" });
  } catch (error) {
    console.error(error);
    res.json({ ok: false, message: "Internal server error" });
  }
};

module.exports.getInspectorsFromTozaMakon = async (req, res) => {
  try {
    const tozaMakonApi = createTozaMakonApi(req.user.companyId);
    const inspectors = (
      await tozaMakonApi.get("/user-service/employees", {
        params: {
          companyId: req.user.companyId,
          isActive: true,
          page: 0,
          size: 1000,
        },
      })
    ).data.content;
    const rows = inspectors.map((inspector) => {
      return {
        id: inspector.id,
        name: inspector.fullName,
      };
    });
    res.json({ ok: true, rows });
  } catch (error) {
    console.error(error);
    res.json({ ok: false, message: "Internal server error" });
  }
};

module.exports.addInspector = async (req, res) => {
  const { id, name } = req.body;
  if (!id || !name) {
    return res
      .status(400)
      .json({ ok: false, message: "id va name kiritilishi shart" });
  }
  const inspector = await Nazoratchi.create({
    id,
    name,
    companyId: req.user.companyId,
    activ: true,
  });
  res.json({ ok: true, inspector });
};

module.exports.setInspectorTelegramId = async (req, res) => {
  const { telegramId } = req.body;
  if (!telegramId) {
    return res
      .status(400)
      .json({ ok: false, message: "telegramId kiritilishi shart" });
  }
  const inspector = await Nazoratchi.findOneAndUpdate(
    { id: req.params.id },
    { telegramId },
    { new: true }
  );
  if (!inspector) {
    return res.status(404).json({ ok: false, message: "Inspector not found" });
  }
  res.json({ ok: true, inspector });
};

module.exports.setInspectorInactive = async (req, res) => {
  const { inactive } = req.body;
  if (inactive === undefined) {
    return res
      .status(400)
      .json({ ok: false, message: "inactive kiritilishi shart" });
  }
  const inspector = await Nazoratchi.findOneAndUpdate(
    { id: req.params.id },
    { activ: inactive },
    { new: true }
  );
  if (!inspector) {
    return res.status(404).json({ ok: false, message: "Inspector not found" });
  }
  res.json({ ok: true, inspector });
};
