const multer = require("multer");
const fs = require("fs");
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
const uploadAsBlob = multer({
  storage: memoryStorage,
  limits: { fileSize: 25 * 1024 * 1024 },
});

const isLimitFileSize = (err, req, res, next) => {
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

const upload = multer({ storage: storage });

module.exports = { upload, uploadAsBlob, isLimitFileSize };
