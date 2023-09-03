const { login } = require("../controllers/authController");

const router = require("express").Router();

// POST login to admin account
router.post("/login", login);

module.exports = router;
