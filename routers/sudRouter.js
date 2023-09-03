const router = require("express").Router();
const {
  getAllAkts,
  getAktById,
  createNewAkt,
  updateAktById,
  deleteById,
  updateAktByKod,
} = require("../controllers/sudAktController");

// get all dates   GET
router.get("/", getAllAkts);
// get one data    GET
router.get("/:id", getAktById);
// create new data POST
router.post("/", createNewAkt);
// update one data PUT
router.put("/:id", updateAktById);
// update one without id PUT
router.put("/", updateAktByKod);
// delete one data DELETE
router.delete("/:id", deleteById);

module.exports = router;
