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
    let sp = file.originalname.split(".");
    cb(null, "forma1" + "." + sp[sp.length - 1]);
  },
});

const upload = multer({ storage: storage });

module.exports = { upload };
