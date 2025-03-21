const { Router } = require("express");
const {
  getTargets,
  createDocumentTargets,
  signDocumentTargets,
  getDocumentTargetsById,
  getDocumentTargets,
  cancelTargetById,
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

router.patch("/cancel/:target_id", cancelTargetById);

router.get("/document", getDocumentTargets);
router.get("/document/:_id", getDocumentTargetsById);

module.exports = router;
