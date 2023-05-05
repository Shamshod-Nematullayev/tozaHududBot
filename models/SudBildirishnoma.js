const { default: mongoose } = require("mongoose");

const schema = new mongoose.Schema({
  user: Object,
  file_id: String,
  inspector: Object,
  mahallalar: Array,
  date: {
    type: Object,
    required: true,
  },
  abonents: Array,
  doc_num: Number,
});

const SudBildirishnoma = mongoose.model("SudBildirishnoma", schema);
module.exports = { SudBildirishnoma };
