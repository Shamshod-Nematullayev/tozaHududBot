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
    const accessToken = jwt.sign(
      {
        id: admin.id,
        login: admin.login,
        // role: admin.role, // hali rollar berilmagan
      },
      process.env.SECRET_JWT_KEY,
      { expiresIn: "1h" }
    );
    const refreshToken = jwt.sign(
      {
        id: admin.id,
        login: admin.login,
      },
      process.env.REFRESH_JWT_KEY,
      { expiresIn: "12h" }
    );
    await admin.updateOne({
      $set: {
        refreshToken: refreshToken,
      },
    });

    res.status(200).json({
      ok: true,
      accessToken,
      refreshToken,
    });
  } catch (ex) {
    next(ex);
  }
});
router.post("/refresh-token", async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) return res.status(401).json({ message: "Unauthorized" });

  const admin = await Admin.findOne({ refreshToken });
  if (!admin) return res.status(403).json({ message: "Invalid refresh token" });

  jwt.verify(refreshToken, process.env.REFRESH_JWT_KEY, (err, decoded) => {
    if (err) return res.status(403).json({ message: "Invalid refresh token" });

    const accessToken = jwt.sign(
      { id: decoded.id, login: decoded.login },
      process.env.SECRET_JWT_KEY,
      { expiresIn: "1h" }
    );

    res.json({ accessToken });
  });
});

router.post("/logout", async (req, res) => {
  const { refreshToken } = req.body;

  await Admin.updateOne({ refreshToken }, { refreshToken: null });

  res.status(200).json({ message: "Logged out successfully" });
});

module.exports = router;
