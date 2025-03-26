const { default: mongoose } = require("mongoose");

const schema = new mongoose.Schema({
  mahallaId: {
    type: Number,
    required: true,
  },
  request_ids: {
    type: Array,
    default: [],
    required: true,
  },
  date: Date,
  documentNumber: Number,
  isCancel: Boolean,
});

const XatlovDocument = mongoose.model("xatlov_document", schema);

module.exports = { XatlovDocument };
