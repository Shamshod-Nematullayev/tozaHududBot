const { default: mongoose } = require("mongoose");

const schema = new mongoose.Schema({
  KOD: {
    type: Number,
    required: true,
    immutable: true,
  },
  YASHOVCHILAR: {
    type: Number,
    required: true,
    immutable: true,
  },
  currentInhabitantCount: Number,
  date: Date,
  from: {
    type: Object,
    required: true,
    immutable: true,
  },
  confirm: {
    type: Boolean,
    default: false,
    required: true,
  },
  mahallaId: String,
  abonentId: {
    type: String,
    required: true,
    immutable: true,
  },
  mahallaName: String,
  fio: String,
  document_id: String,
  isCancel: {
    type: Boolean,
    default: false,
  },
});

const MultiplyRequest = mongoose.model("multipy_request", schema);
module.exports = { MultiplyRequest };
