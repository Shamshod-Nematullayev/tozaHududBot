const { default: mongoose } = require("mongoose");

const schema = new mongoose.Schema({
  KOD: Number,
  YASHOVCHILAR: Number,
  currentInhabitantCount: Number,
  date: Date,
  from: Object,
  confirm: {
    type: Boolean,
    default: false,
    required: true,
  },
  mahallaId: String,
  abonentId: String,
  mahallaName: String,
  fio: String,
  document_id: String,
});

const MultiplyRequest = mongoose.model("multipy_request", schema);
module.exports = { MultiplyRequest };
