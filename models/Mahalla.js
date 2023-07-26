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
});

module.exports.Mahalla = mongoose.model("mahalla", schema);
