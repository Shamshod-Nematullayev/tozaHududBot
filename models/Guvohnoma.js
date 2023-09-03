const { default: mongoose } = require("mongoose");

const schema = mongoose.Schema({
  messageIdChannel: Number,
  kod: {
    type: Number,
    requred: true,
  },
  file_id: String,
  user: Object,
  comment: {
    type: String,
    max: 300,
  },
  holat: String,
  document_number: Number,
  reply_comment: String,
  fhdyo_raqami: String,
});
module.exports.Guvohnoma = mongoose.model("guvohnoma", schema, "guvohnoma");
