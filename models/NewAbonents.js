const { Schema, model } = require("mongoose");

const schema = new Schema({
  nazoratchi_id: String,
  mahalla_id: String,
  abonent_name: String,
  licshet: String,
});

module.exports.NewAbonent = model("new_abonent", schema);
