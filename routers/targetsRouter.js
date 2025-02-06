const { Router } = require("express");
const {
  getTargets,
  createDocumentTargets,
  signDocumentTargets,
} = require("./controllers/targets.controller");
const { uploadAsBlob } = require("../middlewares/multer");
const router = Router();

router.get("/", getTargets);

router.post("/createDocument", createDocumentTargets);

router.patch(
  "/signDocument/:document_id",
  uploadAsBlob.single("file"),
  signDocumentTargets
);

module.exports = router;
