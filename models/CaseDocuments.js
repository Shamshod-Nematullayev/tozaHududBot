const { default: mongoose } = require("mongoose");

const schema = new mongoose.Schema({
  sudAktId: String,
  case_id: String,
  isSavedBilling: {
    type: Boolean,
    default: false,
  },
  document_id: String,
  file_id: String,
  owner_name: String,
  id: String,
});

module.exports.CaseDocument = mongoose.model(
  "case_document",
  schema,
  "case_documents"
);
