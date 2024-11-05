const { Admin } = require("../models/Admin");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const router = require("express").Router();

// POST login to admin account
router.post("/login", async (req, res, next) => {
  try {
    const { login, password } = req.body;
    const admin = await Admin.findOne({
      login,
    });
    if (!admin) {
      return res.status(200).json({
        ok: false,
        message: "Login yoki parol mos kelmadi",
      });
    }
    const validPassword = await bcrypt.compare(password, admin.password);
    if (!validPassword) {
      return res.json({
        ok: false,
        message: "Login yoki parol mos kelmadi",
      });
    }
    const token = jwt.sign(
      {
        id: admin.id,
        login: admin.login,
        // role: admin.role, // hali rollar berilmagan
      },
      process.env.SECRET_JWT_KEY,
      { expiresIn: "1h" }
    );
    res.status(200).json({
      ok: true,
      token,
    });
  } catch (ex) {
    next(ex);
  }
});

module.exports = router;
