const {
  getAllBildirgilar,
  getBildirgiById,
} = require("../controllers/bildirgilarController");

const router = require("express").Router();

// Method GET all datas
router.get("/", getAllBildirgilar);

// Method GET by id
router.get("/:id", getBildirgiById);

module.exports = router;
