import { Admin } from "@models/Admin.ts";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { bot } from "../bot/core/bot.js";
import axios from "axios";
import isAuth from "../middlewares/isAuth.ts";
import { Company } from "@models/Company.ts";
import { MyRequest } from "interfaces/express.interfaces.ts";
import { NextFunction, Response, Router } from "express";

const router = Router();

// POST login to admin account
router.post(
  "/login",
  async (req: MyRequest, res: Response, next: NextFunction): Promise<any> => {
    try {
      const { login, password } = req.body;
      const admin: any = await Admin.findOne({
        login,
      });
      if (!admin) {
        return res.json({ ok: false, message: "Login yoki parol mos kelmadi" });
      }
      const validPassword = await bcrypt.compare(
        password,
        admin.password || ""
      );
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
          fullName: admin.fullName,
          role: admin.roles, // hali rollar berilmagan
        },
        process.env.SECRET_JWT_KEY as string,
        { expiresIn: "1h" }
      );
      const refreshToken = jwt.sign(
        {
          id: admin.id,
          login: admin.login,
          companyId: admin.companyId,
          fullName: admin.fullName,
          role: admin.roles,
        },
        process.env.REFRESH_JWT_KEY as string,
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
        const file = await bot.telegram.getFile(ctx.photo.small_file_id);
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
        abonentsPrefix: company?.abonentsPrefix,
        user: {
          login: admin.login,
          fullName: admin.fullName,
          pnfl: admin.pnfl,
          companyId: admin.companyId,
          roles: admin.roles,
        },
        company: {
          id: company?.id,
          name: company?.name,
          locationName: company?.locationName,
          phone: company?.phone,
          managerName: company?.manager?.fullName,
          billingAdminName: company?.billingAdmin?.fullName,
          gpsOperatorName: company?.gpsOperator?.fullName,
        },
      });
    } catch (ex) {
      next(ex);
    }
  }
);
router.post(
  "/refresh-token",
  async (req: MyRequest, res: Response, next: NextFunction): Promise<any> => {
    const { refreshToken } = req.body;

    if (!refreshToken) return res.status(401).json({ message: "Unauthorized" });

    const admin = await Admin.findOne({ refreshToken });
    if (!admin)
      return res.status(403).json({ message: "Invalid refresh token" });

    jwt.verify(
      refreshToken,
      process.env.REFRESH_JWT_KEY as string,
      (err: any, decoded: any) => {
        if (err)
          return res.status(403).json({ message: "Invalid refresh token" });

        const accessToken = jwt.sign(
          {
            id: decoded.id,
            login: decoded.login,
            companyId: admin.companyId,
            fullName: admin.fullName,
            roles: admin.roles,
          },
          process.env.SECRET_JWT_KEY as string,
          { expiresIn: "1h" }
        );

        res.json({ accessToken });
      }
    );
  }
);

router.post("/logout", async (req: MyRequest, res: Response) => {
  const { refreshToken } = req.body;

  await Admin.updateOne({ refreshToken }, { refreshToken: null });

  res.status(200).json({ message: "Logged out successfully" });
});

router.put(
  "/change-password",
  isAuth,
  async (req: MyRequest, res: Response): Promise<any> => {
    try {
      if (!req.body.newPassword || !req.body.login || !req.body.password) {
        return res.status(400).json({
          message: "All fields are required. newPassword, login, password",
        });
      }
      const admin = await Admin.findOne({ login: req.body.login });
      if (!admin) {
        return res.status(400).json({
          ok: false,
          message: "Admin topilmadi",
        });
      }
      const validPassword = await bcrypt.compare(
        req.body.password,
        admin.password
      );
      if (!validPassword) {
        return res.status(400).json({
          ok: false,
          message: "Parol mos kelmadi",
        });
      }
      await Admin.findByIdAndUpdate(admin._id, {
        $set: {
          password: await bcrypt.hash(req.body.newPassword, 10),
        },
      });
      res.status(200).json({
        ok: true,
        message: "Parol muvaffaqqiyatli o'zgartirildi",
      });
    } catch (error) {
      res.status(500).json({
        ok: false,
        message: "Internal server error",
      });
    }
  }
);

router.get(
  "/get-photo",
  isAuth,
  async (req: MyRequest, res: Response): Promise<any> => {
    try {
      const user = await Admin.findById(req.user?.id);
      if (!user)
        return res.status(404).json({ ok: false, message: "Admin topilmadi" });
      const ctx = await bot.telegram.getChat(user.user_id);
      let photo = { data: null };
      if (ctx.photo) {
        const file = await bot.telegram.getFile(ctx.photo.small_file_id);
        photo = await axios.get(
          `https://api.telegram.org/file/bot${process.env.TOKEN}/${file.file_path}`,
          { responseType: "arraybuffer" }
        );
      }
      res.status(200).json({ ok: true, photo: photo.data });
    } catch (error) {
      res.status(500).json({ ok: false, message: "Internal server error" });
      console.error(error);
    }
  }
);

export default router;
