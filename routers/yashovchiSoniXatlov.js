const { uploadAsBlob } = require("../middlewares/multer");
const {
  cancelDalolatnoma,
  createXatlovDocument,
  getMultiplyRequests,
  getMahallasMultiplyRequests,
  updateFromTozamakon,
  updateMultiplyRequest,
  getOneDalolatnoma,
  confirmDalolatnoma,
  getRowsByIds,
} = require("./controllers/xatlovInhabitantCnt.controller");

const router = require("express").Router();

router.post("/", createXatlovDocument);
router.get("/", getMultiplyRequests);

router.get("/mahallas", getMahallasMultiplyRequests);

router.patch("/update-from-tozamakon/:_id", updateFromTozamakon);

router.put("/:_id", updateMultiplyRequest);

router.get("/get-one-dalolatnoma", getOneDalolatnoma);

router.put("/confirm/:_id", uploadAsBlob.single("file"), confirmDalolatnoma);

router.get("/get-rows-by-ids", getRowsByIds);

router.put("/cancel-document", cancelDalolatnoma);

module.exports = router;
