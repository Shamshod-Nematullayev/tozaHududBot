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
  fullName: String,
  mahalla_id: String,
  inspector_id: String,
  inspector_name: String,
  document_id: String,
  companyId: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: [
      "yangi",
      "xujjat_yaratildi",
      "tasdiqlandi",
      "sudga_yuborildi",
      "sud_qarori_chiqarildi",
      "bekor_qilindi",
    ],
    default: "yangi",
  },
  createdAt: {
    type: Date,
    default: new Date(),
  },
});

module.exports.Target = mongoose.model("target", schema);
