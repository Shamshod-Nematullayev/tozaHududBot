const { default: mongoose } = require("mongoose");

const schema = mongoose.Schema({
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
});
module.exports.Guvohnoma = mongoose.model("guvohnoma", schema, "guvohnoma");
