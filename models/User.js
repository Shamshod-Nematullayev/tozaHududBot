const { default: mongoose } = require("mongoose");

const schema = new mongoose.Schema({
  user: Object,
  level: Number,
  job: String,
  created: Date,
});

const User = mongoose.model("user", schema);

module.exports = { User };
