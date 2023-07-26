const { Admin } = require("../models/Admin");

async function isAdmin(user_id) {
  const admin = await Admin.findOne({ user_id });
  if (!admin) return false;

  return true;
}

module.exports = { isAdmin };
