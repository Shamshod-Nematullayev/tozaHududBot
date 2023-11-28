const { default: mongoose } = require("mongoose");

const schema = new mongoose.Schema({
  KOD: Number,
  YASHOVCHILAR: Number,
  date: Date,
  from: Object,
  confirm: Boolean,
  abonent: Object,
});

const MultiplyRequest = mongoose.model("multipy_request", schema);
module.exports = { MultiplyRequest };
