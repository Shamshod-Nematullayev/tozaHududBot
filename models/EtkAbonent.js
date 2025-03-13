const { Schema, model } = require("mongoose");

const schema = new Schema({
  accountNumber: {
    type: String,
    required: true,
    unique: true,
  },
  customerName: {
    type: String,
    required: true,
  },
  caotoNumber: {
    type: String,
    required: true,
  },
});

module.exports.EtkAbonent = model("etk_abonent", schema);
