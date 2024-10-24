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
const Counter = mongoose.model("counter", schema, "counter");

module.exports = { Counter };
// creating counter for incoming document serial number
(async () => {
  const counterNames = [
    "incoming_document_number",
    "shaxsi_tashdiqlandi_bildirish_xati",
    "ariza_tartib_raqami",
    "sudga_ariza_tartib_raqami",
  ];
  async function checkAndCreateCounter(name) {
    const counter = await Counter.findOne({ name });
    if (!counter) {
      await Counter.create({ name, value: 0 });
    }
  }
  counterNames.forEach((name) => checkAndCreateCounter(name));
})();
