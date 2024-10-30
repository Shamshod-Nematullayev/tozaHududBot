const { Schema, model } = require("mongoose");

const schema = new Schema({
  licshet: {
    type: String,
    required: true,
  },
  abonent_id: String,
  etk_kod: {
    type: String,
    required: true,
  },
  etk_saoto: {
    type: String,
    required: true,
  },
  phone: String,
});

module.exports.EtkKodRequest = model("etk_requests", schema);
