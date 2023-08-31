const { default: mongoose } = require("mongoose");

const schema = new mongoose.Schema({
  value: Number,
  name: String,
  last_update: Date,
});

// auto incement uchun yaratilgan model
// name: counter nomi boshqalaridan ajratib olish uchun
// value: counter qiymati
// last_update: ohirgi marta qachon yangilanganligi
module.exports.Counter = mongoose.model("counter", schema, "counter");
