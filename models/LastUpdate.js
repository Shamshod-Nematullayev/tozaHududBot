const { default: mongoose } = require("mongoose");
const { Schema } = require("mongoose");

const LastUpdate = mongoose.model(
  "LastUpdate",
  new Schema({
    key: String,
    value: Date,
  })
);

module.exports = { LastUpdate };
