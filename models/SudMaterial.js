const { Schema, model } = require("mongoose");

const schema = new Schema({
  name: String,
  items: Array(),
});

module.exports.SudMaterial = model("sud_material", schema);
