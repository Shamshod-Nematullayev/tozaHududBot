const { default: mongoose } = require("mongoose");

const schema = new mongoose.Schema({
  user: Object,
  type: {
    type: String,
    required: true,
    enum: ["sudga_chiqoring", "shaxsi_tasdiqlandi"],
  },
  file_id: {
    type: String,
  },
  inspector: {
    type: Object,
    required: true,
  },
  mahallaId: {
    type: Number,
    required: true,
  },
  mahallalar: Array,
  date: Object,
  abonents: {
    type: Array,
    required: true,
    minlength: 1,
  },
  targets: {
    type: Array,
    required: true,
    minlength: 1,
  },
  doc_num: Number,
  file_link: String,
  file_name: String,
});

module.exports.Bildirishnoma = mongoose.model("sudBildirishnoma", schema);
