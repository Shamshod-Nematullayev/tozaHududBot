const { default: mongoose } = require("mongoose");

const schema = new mongoose.Schema({
  KOD: Number,
  YASHOVCHILAR: Number,
  date: Date,
  from: Object,
  confirm: Boolean,
  mahallaId: String,
  abonentId: String,
  mahallaName: String,
  fio: String,
});

const MultiplyRequest = mongoose.model("multipy_request", schema);
module.exports = { MultiplyRequest };
