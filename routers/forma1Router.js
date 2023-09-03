const {
  getAllForm,
  createForm,
  getFormById,
  importForm,
} = require("../controllers/formController");
const { upload } = require("../middlewares/multer");

const router = require("express").Router();

// get all
router.get("/", getAllForm);

// get one by id
router.get("/:id", getFormById);

// get f
router.post("/", upload.single("file"), createForm);

// import zip file
router.post("/import", upload.single("file"), importForm);

module.exports = router;
