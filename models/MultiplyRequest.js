const { default: mongoose } = require("mongoose");

const schema = mongoose.Schema({
  KOD: Number,
  YASHOVCHILAR: Number,
  date: Date,
  from: Object,
  confirm: Boolean,
});

const MultiplyRequest = mongoose.model("multipy_request", schema);
module.exports = { MultiplyRequest };
