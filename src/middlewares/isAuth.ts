import { Handler } from 'express';
import jwt from 'jsonwebtoken';

const isAuth: Handler = (req, res, next): any => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access Denied: No Token Provided' });
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.SECRET_JWT_KEY as string);
    req.user = decoded as {
      id: string;
      companyId: number;
      roles: string[];
      fullName: string;
      login: string;
      isTestUser?: boolean;
    }; // Add user data to request
    if (req.user.roles.includes('stm') && req.query.companyId) {
      req.user.companyId = Number(req.query.companyId);
    }
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid Token' });
  }
};

export default isAuth;
