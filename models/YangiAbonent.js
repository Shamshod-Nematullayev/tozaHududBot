const { default: mongoose } = require("mongoose");

const schema = new mongoose.Schema({
  user: Object,
  messageIdChannel: Number,
  kod: Number,
  data: Object,
  isCancel: Boolean,
});

module.exports.Abonent = mongoose.model("abonent", schema);
