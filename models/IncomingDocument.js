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

// creating counter for incoming document serial number
(async () => {
  const counter = await Counter.findOne({ name: "incoming_document_number" });
  if (!counter) {
    await Counter.create({ name: "incoming_document_number", value: 0 });
  }
})();
module.exports = { IncomingDocument };
