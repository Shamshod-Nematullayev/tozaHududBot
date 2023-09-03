const {
  getAllPachka,
  getElementsPachka,
  createNewPachka,
  updatePachkaById,
  deletePachkaById,
  sudgaYuborish,
} = require("../controllers/sudAktPachkaControllers");

const router = require("express").Router();

router.get("/", getAllPachka);
router.get("/:pachka_id", getElementsPachka);
router.post("/", createNewPachka);
router.put("/:pachka_id", updatePachkaById);
router.delete("/:pachka_id", deletePachkaById);
router.get("/:pachka_id/sudgaYuborish/", sudgaYuborish);

module.exports = router;
