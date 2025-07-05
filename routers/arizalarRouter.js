const { Ariza } = require("../models/Ariza");
const { Counter } = require("../models/Counter");
const { Abonent } = require("../models/Abonent");
const {
  getArizaById,
  getArizalar,
  updateArizaFromBillingById,
  changeArizaAct,
  addImageToAriza,
  cancelArizaById,
  createAriza,
  moveToInboxAriza,
  updateArizaById,
  createMonayTransferAriza,
} = require("./controllers/arizalar.controller");
const { uploadAsBlob } = require("../middlewares/multer");

const router = require("express").Router();

router.get("/", getArizalar);

router.get("/:_id", getArizaById);

router.post("/cancel-ariza-by-id", cancelArizaById);

router.post("/create", createAriza);

router.patch("/move-to-inbox/:ariza_id", moveToInboxAriza);
router.patch("/:ariza_id", updateArizaById);

router.put("/updateFromBilling/:ariza_id", updateArizaFromBillingById);

router.put(
  "/change-akt/:ariza_id",
  uploadAsBlob.single("file"),
  changeArizaAct
);

router.put("/add-image/:ariza_id", addImageToAriza);

router.post("/create-monay-transfer-ariza", createMonayTransferAriza);

module.exports = router;
