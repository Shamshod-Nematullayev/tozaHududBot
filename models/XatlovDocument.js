const { default: mongoose } = require("mongoose");

const schema = new mongoose.Schema({
  mahallaId: {
    type: Number,
    required: true,
  },
  abonents: {
    type: Array,
    default: [],
    required: true,
  },
  date: Date,
  documentNumber: Number,
});

const XatlovDocument = mongoose.model("xatlov_document", schema);

module.exports = { XatlovDocument };
