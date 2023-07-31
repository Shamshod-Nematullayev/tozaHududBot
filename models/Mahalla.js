const { default: mongoose } = require("mongoose");

const schema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  reja: {
    type: Number,
  },
  biriktirilganNazoratchi: Object,
});

module.exports.Mahalla = mongoose.model("mahalla", schema);
