const { default: mongoose } = require("mongoose");

const schema = new mongoose.Schema({
  user: Object,
  file_id: String,
  inspector: Object,
  mahallalar: Array,
  date: Date,
  abonents: Array,
});

const SudBildirishnoma = mongoose.model("SudBildirishnoma", schema);
module.exports = { SudBildirishnoma };
