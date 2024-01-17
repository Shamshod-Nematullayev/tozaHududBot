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
  ommaviy_shartnoma: Object,
  groups: {
    type: Array,
    default: [],
  },
});

module.exports.Mahalla = mongoose.model("mahalla", schema);
