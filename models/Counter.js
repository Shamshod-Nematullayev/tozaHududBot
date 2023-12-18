const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    value: Number,
    name: String,
    last_update: Date,
  },
  { timestamps: true }
);

// auto incement uchun yaratilgan model
// name: counter nomi boshqalaridan ajratib olish uchun
// value: counter qiymati
// last_update: ohirgi marta qachon yangilanganligi
module.exports.Counter = mongoose.model("counter", schema, "counter");
// creating counter for incoming document serial number
(async () => {
  const counter = await this.Counter.findOne({
    name: "incoming_document_number",
  });
  const counterShaxsiTasdiqlandi = await this.Counter.findOne({
    name: "shaxsi_tashdiqlandi_bildirish_xati",
  });
  if (!counter) {
    await this.Counter.create({ name: "incoming_document_number", value: 0 });
  }
  if (!counterShaxsiTasdiqlandi) {
    await this.Counter.create({
      name: "shaxsi_tashdiqlandi_bildirish_xati",
      value: 0,
    });
  }
})();
