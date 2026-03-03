import { Admin } from '@models/Admin.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { bot } from '@bot/core/bot.js';
import axios from 'axios';
import { Company } from '@models/Company.js';
import { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import qs from 'querystring';
import crypto from 'crypto';
import z from 'zod';
import { FRONTEND_URL, GOOGLE_REDIRECT_URI } from 'constants.js';
import { RefreshToken } from '@models/RefreshToken.js';

export const hashToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Login
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<any>} - Promise that resolves with the response object
 *
 * Login endpoint. It takes login and password in the request body and returns an access token and a refresh token.
 * If the login or password is incorrect, it returns an error message.
 * If the company is inactive, it returns an error message.
 * If the user is a test user, it sets the `isTestUser` field in the response to true.
 */
export const login = async (req: Request, res: Response): Promise<any> => {
  try {
    const { login, password } = req.body;
    const admin: any = await Admin.findOne({ login });

    if (!admin) {
      return res.json({ ok: false, message: 'Login yoki parol mos kelmadi' });
    }

    const validPassword = await bcrypt.compare(password, admin.password || '');
    if (!validPassword) {
      return res.json({
        ok: false,
        message: 'Login yoki parol mos kelmadi',
      });
    }

    const accessToken = jwt.sign(
      {
        id: admin.id,
        login: admin.login,
        companyId: admin.companyId,
        fullName: admin.fullName,
        roles: admin.roles,
        isTestUser: admin.isTestUser,
      },
      process.env.SECRET_JWT_KEY as string,
      { expiresIn: '1h' }
    );

    const refreshToken = jwt.sign(
      {
        id: admin.id,
        login: admin.login,
        companyId: admin.companyId,
        fullName: admin.fullName,
        roles: admin.roles,
      },
      process.env.REFRESH_JWT_KEY as string,
      { expiresIn: '24h' }
    );

    // Store refresh token in database
    await RefreshToken.create({
      userId: admin._id,
      tokenHash: hashToken(refreshToken),
      userAgent: req.headers['user-agent'],
      ip: req.ip,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      revoked: false,
    });

    // Set refresh token cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    });

    const company = await Company.findOne({
      id: admin.companyId, // ✅ id o‘rniga _id
      activeExpiresDate: { $gt: new Date() },
    });

    if (!company) {
      return res.status(400).json({
        ok: false,
        message:
          'Dastur faoliyati vaqtincha cheklangan. \nIltimos, xizmatlardan foydalanishni davom ettirish uchun to‘lovni amalga oshiring.',
      });
    }

    return res.status(200).json({
      ok: true,
      accessToken,
      telegram_id: admin.user_id,
      fullName: admin.fullName,
      photo: { data: null },
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
  } catch (error) {
    console.error(error);
    return res.status(500).json({ ok: false, message: 'Internal server error' });
  }
};

export const refreshToken = async (req: Request, res: Response): Promise<any> => {
  const { refreshToken } = req.cookies;

  if (!refreshToken) return res.status(401).json({ message: 'Unauthorized' });

  const token = await RefreshToken.findOne({ tokenHash: hashToken(refreshToken) });
  if (!token) return res.status(401).json({ message: 'Invalid refresh token' });

  if (token.revoked) return res.status(401).json({ message: 'Invalid refresh token' });

  jwt.verify(refreshToken, process.env.REFRESH_JWT_KEY as string, (err: any, decoded: any) => {
    if (err) return res.status(401).json({ message: 'Invalid refresh token' });

    const accessToken = jwt.sign(
      {
        id: decoded.id,
        login: decoded.login,
        companyId: decoded.companyId,
        fullName: decoded.fullName,
        roles: decoded.roles,
      },
      process.env.SECRET_JWT_KEY as string,
      { expiresIn: '15m' }
    );

    return res.json({ accessToken });
  });
};

export const logout = async (req: Request, res: Response): Promise<any> => {
  const { refreshToken } = req.body;

  if (!refreshToken) return res.status(401).json({ message: 'Unauthorized' });

  await RefreshToken.updateOne({ tokenHash: hashToken(refreshToken) }, { revoked: true });
  return res.status(200).json({ message: 'Logged out successfully' });
};

export const changePassword = async (req: Request, res: Response): Promise<any> => {
  try {
    if (!req.body.newPassword || !req.body.login || !req.body.password) {
      return res.status(400).json({
        message: 'All fields are required. newPassword, login, password',
      });
    }
    const admin = await Admin.findOne({ login: req.body.login });
    if (!admin) {
      return res.status(400).json({
        ok: false,
        message: 'Admin topilmadi',
      });
    }
    const validPassword = await bcrypt.compare(req.body.password, admin.password);
    if (!validPassword) {
      return res.status(400).json({
        ok: false,
        message: 'Parol mos kelmadi',
      });
    }
    await Admin.findByIdAndUpdate(admin._id, {
      $set: {
        password: await bcrypt.hash(req.body.newPassword, 10),
      },
    });
    return res.status(200).json({
      ok: true,
      message: "Parol muvaffaqqiyatli o'zgartirildi",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      ok: false,
      message: 'Internal server error',
    });
  }
};

export const getPhoto = async (req: Request, res: Response): Promise<any> => {
  try {
    const user = await Admin.findById(req.user?.id);
    if (!user) return res.status(404).json({ ok: false, message: 'Admin topilmadi' });

    const ctx = await bot.telegram.getChat(user.user_id);
    let photo = { data: null };

    if (ctx.photo) {
      const file = await bot.telegram.getFile(ctx.photo.small_file_id);
      photo = await axios.get(`https://api.telegram.org/file/bot${process.env.TOKEN}/${file.file_path}`, {
        responseType: 'arraybuffer',
      });
    }

    return res.status(200).json({ ok: true, photo: photo.data });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ ok: false, message: 'Internal server error' });
  }
};

export const loginByGoogle = async (req: Request, res: Response): Promise<any> => {
  const { code, state } = z.object({ code: z.string(), state: z.string() }).parse(req.query);

  const savedState = req.cookies.oauth_state;
  console.log(savedState, state);
  // if (savedState !== state) return res.status(400).json({ message: 'Invalid state' });
  res.clearCookie('oauth_state');

  const { id_token } = (
    await axios.post(
      'https://oauth2.googleapis.com/token',
      qs.stringify({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: GOOGLE_REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    )
  ).data;

  const googleUser = (
    await client.verifyIdToken({
      idToken: id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    })
  ).getPayload();

  if (!googleUser) {
    return res.status(400).json({ message: 'Google user not found' });
  }

  const user = await Admin.findOne({ email: googleUser?.email });

  if (!user) {
    return res.status(400).json({ message: 'User not found' });
  }

  const accessToken = jwt.sign(
    {
      id: user.id,
      login: user.login,
      companyId: user.companyId,
      fullName: user.fullName,
      roles: user.roles,
    },
    process.env.SECRET_JWT_KEY as string,
    { expiresIn: '1h' }
  );

  // Generate refresh token
  const refreshToken = jwt.sign(
    {
      id: user.id,
      login: user.login,
      companyId: user.companyId,
      fullName: user.fullName,
      roles: user.roles,
    },
    process.env.REFRESH_JWT_KEY as string,
    { expiresIn: '1d' }
  );

  // Store refresh token in database
  await RefreshToken.create({
    userId: user.id,
    tokenHash: hashToken(refreshToken),
    userAgent: req.headers['user-agent'] || '',
    ip: req.ip,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    revoked: false,
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000,
  });

  return res.redirect(`${FRONTEND_URL}/oauth-success?accessToken=${accessToken}`);
};

export const redirectToGoogle = async (req: Request, res: Response) => {
  const state = crypto.randomBytes(32).toString('hex');

  res.cookie('oauth_state', state, {
    httpOnly: true,
    secure: false, //process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 5 * 60 * 1000, // 5 minut
  });

  const googleAuthUrl =
    'https://accounts.google.com/o/oauth2/v2/auth?' +
    new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      redirect_uri: GOOGLE_REDIRECT_URI!,
      response_type: 'code',
      scope: 'openid email profile',
      state,
    }).toString();

  return res.redirect(googleAuthUrl);
};
