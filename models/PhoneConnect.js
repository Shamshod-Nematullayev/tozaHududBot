const { Schema, model } = require("mongoose");

const schema = new Schema({
  KOD: Number,
  phone: String,
  needSMS: Boolean,
  from: Object,
});

module.exports.PhoneConnect = model("phone_connect", schema);
