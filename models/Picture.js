const { default: mongoose } = require("mongoose");

const schema = new mongoose.Schema({
  user_id: {
    type: Number,
  },
  photo_file_id: {
    type: String,
    required: true,
  },
  kod: {
    type: Number,
    required: true,
  },
  type: String,
  confirm: {
    type: String,
    default: "YANGI",
  },
  messageIdChannel: Number,
  createdAt: Date,
  file_link: String,
  file_name: String,
});

const Picture = mongoose.model("picture", schema);
module.exports = { Picture };
