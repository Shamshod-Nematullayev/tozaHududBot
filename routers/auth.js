const { Admin } = require("../models/Admin");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { bot, Company } = require("../requires");
const { default: axios } = require("axios");
const isAuth = require("../middlewares/isAuth");
const { message } = require("telegraf/filters");

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
        companyId: admin.companyId,
        // role: admin.role, // hali rollar berilmagan
      },
      process.env.SECRET_JWT_KEY,
      { expiresIn: "1h" }
    );
    const refreshToken = jwt.sign(
      {
        id: admin.id,
        login: admin.login,
        companyId: admin.companyId,
      },
      process.env.REFRESH_JWT_KEY,
      { expiresIn: "12h" }
    );
    await admin
      .updateOne({
        $set: {
          refreshToken: refreshToken,
        },
      })
      .lean();
    const ctx = await bot.telegram.getChat(admin.user_id);
    let photo = { data: null };
    if (ctx.photo) {
      const file = await bot.telegram.getFile(ctx.photo.big_file_id);
      photo = await axios.get(
        `https://api.telegram.org/file/bot${process.env.TOKEN}/${file.file_path}`,
        { responseType: "arraybuffer" }
      );
    }
    const company = await Company.findOne({ id: admin.companyId });
    delete admin.password;
    delete admin.refreshToken;
    res.status(200).json({
      ok: true,
      accessToken,
      refreshToken,
      telegram_id: admin.user_id,
      fullName: admin.fullName,
      photo: photo.data,
      abonentsPrefix: company.abonentsPrefix,
      user: {
        login: admin.login,
        fullName: admin.fullName,
        pnfl: admin.pnfl,
        companyId: admin.companyId,
        roles: admin.roles,
      },
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
      { id: decoded.id, login: decoded.login, companyId: admin.companyId },
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

router.put("/change-password", isAuth, async (req, res) => {
  try {
    if (!req.body.newPassword || !req.body.login || !req.body.password) {
      return res.status(400).json({
        message: "All fields are required. newPassword, login, password",
      });
    }
    const admin = await Admin.findOne({ login: req.body.login });
    const validPassword = await bcrypt.compare(
      req.body.password,
      admin.password
    );
    if (!validPassword) {
      return res.status(401).json({
        ok: false,
        message: "Parol mos kelmadi",
      });
    }
    await Admin.findByIdAndUpdate(admin._id, {
      $set: {
        password: await bcrypt.hash(req.body.newPassword, 10),
      },
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: "Internal server error",
    });
  }
});

module.exports = router;
