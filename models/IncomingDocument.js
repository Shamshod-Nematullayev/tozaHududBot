const { default: mongoose } = require("mongoose");

const schema = new mongoose.Schema({
  user: Object,
  file_id: String,
  inspector: Object,
  date: Date,
  abonent: Number,
  doc_num: Number,
  doc_type: String,
});

const IncomingDocument = mongoose.model("IncomingDocument", schema);
module.exports = { IncomingDocument };
