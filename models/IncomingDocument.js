const { default: mongoose } = require("mongoose");
const { Counter } = require("./Counter");

const schema = new mongoose.Schema({
  user: Object,
  file_id: String,
  file_name: String,
  inspector: Object,
  date: Date,
  abonent: Number,
  abonents: Array,
  doc_num: Number,
  doc_type: String,
  comment: String,
});

const IncomingDocument = mongoose.model("IncomingDocument", schema);

module.exports = { IncomingDocument };
