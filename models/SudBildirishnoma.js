const { default: mongoose } = require("mongoose");

const schema = mongoose.Schema({
  user: Object,
  file_id: {
    type: String,
    required: true,
  },
  inspector: {
    type: Object,
    required: true,
  },
  mahallalar: Array,
  date: Object,
  abonents: Array,
  doc_num: Number,
  file_link: String,
  file_name: String,
});

module.exports.Bildirishnoma = mongoose.model("sudBildirishnoma", schema);
