import multer from "multer";
import fs from "fs";
import { NextFunction, Request, Response } from "express";
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    //if that dir is not created then this will create that dir first
    fs.mkdir("./uploads/", (err) => {
      cb(null, "./uploads/");
    });
  },
  filename: function (req, file, cb) {
    // let sp = file.originalname.split(".");
    cb(null, file.originalname);
  },
});

const memoryStorage = multer.memoryStorage();
export const uploadAsBlob = multer({
  storage: memoryStorage,
  limits: { fileSize: 25 * 1024 * 1024 },
});

export const isLimitFileSize = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.json({
        ok: false,
        message: "File is too large. Maximum size is 10 MB.",
      });
    }
  }
  next(err);
};

export const upload = multer({ storage: storage });
