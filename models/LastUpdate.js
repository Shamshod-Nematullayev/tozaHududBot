const { default: mongoose } = require("mongoose");
const { Schema } = require("mongoose");

const LastUpdate = mongoose.model(
  "LastUpdate",
  new Schema({
    key: String,
    rows: Array,
    last_update: Date,
    page: Number,
  })
);

module.exports = { LastUpdate };
