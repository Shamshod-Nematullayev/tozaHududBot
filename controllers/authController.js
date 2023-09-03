const { Admin } = require("../models/Admin");

module.exports.login = async (req, res, next) => {
  try {
    const { login } = req.body;
    const admin = await Admin.findOne({
      login,
      password: req.body.password,
    });
    if (!admin) {
      return res.status(200).json({
        ok: false,
        message: "Login yoki parol mos kelmadi",
      });
    }
    admin.password = undefined;
    res.status(200).json({
      ok: true,
      user: admin,
    });
  } catch (ex) {
    next(ex);
  }
};
