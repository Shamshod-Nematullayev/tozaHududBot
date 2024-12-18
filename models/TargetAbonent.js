const { default: mongoose } = require("mongoose");

const schema = new mongoose.Schema({
  abonent_id: {
    type: Number,
    required: true,
  },
  accountNumber: {
    type: String,
    required: true,
  },
  mahalla_id: String,
  inspector_id: String,
  inspector_name: String,
  document_id: String,
  status: {
    type: String,
    enum: ["yangi", "tasdiqlandi", "sudga_yuborildi", "sud_qarori_chiqarildi"],
    default: "yangi",
  },
  createdAt: {
    type: Date,
    default: new Date(),
  },
});

module.exports.Target = mongoose.model("sudBildirishnoma", schema);
