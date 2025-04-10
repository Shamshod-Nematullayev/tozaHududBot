const { Nazoratchi } = require("../../models/Nazoratchi");
const { Mahalla } = require("../../models/Mahalla");

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
