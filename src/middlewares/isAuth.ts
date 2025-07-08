import { NextFunction, Response, RequestHandler } from "express";
import { MyRequest } from "interfaces/express.interfaces";
import jwt from "jsonwebtoken";

const isAuth: (req: MyRequest, res: Response, next: NextFunction) => any = (
  req: MyRequest,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res
      .status(401)
      .json({ message: "Access Denied: No Token Provided" });
  }
  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.SECRET_JWT_KEY as string);
    req.user = decoded as {
      id: string;
      companyId: number;
      roles: string[];
    }; // Add user data to request
    if (req.user.roles.includes("stm") && req.query.companyId) {
      req.user.companyId = Number(req.query.companyId);
    }
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid Token" });
  }
};

export default isAuth;
