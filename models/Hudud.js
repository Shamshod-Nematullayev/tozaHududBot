const { default: mongoose } = require("mongoose");

// Viloyatdagi har bir tuman uchun reja belgilash
const schema = new mongoose.Schema({
  ID: Number,
  name: String,
  monthly_plan: Object,
});
module.exports.Hudud = mongoose.model("hudud", schema, "hududlar");
