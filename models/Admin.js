const { default: mongoose } = require("mongoose");

const schema = new mongoose.Schema({
  user_id: {
    type: Number,
    required: true,
  },
  login: String,
  password: String,
  refreshToken: String,
  fullName: String,
  profilePhotoId: String,
  companyId: Number,
  roles: Array,
});
module.exports.Admin = mongoose.model("admin", schema, "admin");
