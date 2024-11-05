const { default: mongoose } = require("mongoose");

const schema = new mongoose.Schema({
  user_id: Number,
  login: String,
  password: String,
});
module.exports.Admin = mongoose.model("admin", schema, "admin");
