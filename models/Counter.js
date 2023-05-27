const { default: mongoose } = require("mongoose");

const schema = mongoose.Schema({
  value: Number,
  name: String,
  last_update: Date,
});
module.exports.Counter = mongoose.model("counter", schema, "counter");
