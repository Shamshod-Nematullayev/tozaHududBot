const { default: mongoose } = require("mongoose");

const schema = new mongoose.Schema(
  {
    "№": String,
    reg_number: Number,
    "Yaratilgan sana": String,
    "bildirish xati": String,
    "огоҳ-риш хати юборилган": String,
    "Ogohlantirilgan sana": String,
    licshet: String,
    sud_process_id_billing: String,
    sud_process_status: String,
    fio: String,
    "mahalla nomi": String,
    "process boshidagi qarz": String,
    "BILLING PNFL": String,
    "FORMA 1": String,
    "Ariza sanasi": String,
    case_id: String,
    "Sud Ijro raqami": String,
    "my.sud.uz": String,
    "yuborilgan vaqt": String,
    "yuborilgan sana": String,
    "da'vo qilingan summa": String,
    "Sud holati": String,
    "sud natijasi": String,
    "Ishni ko'rgan sudya": String,
    "sud bazasida asosiy qarzdorlikning ijro holati": String,
    "id raqami": String,
    summasi: String,
    "To'langan sanasi": String,
    "To'landi": String,
    "Bugungi kundagi qarzdorlik,06.04.2024": String,
    sudQaroriBillinggaYuklandi: {
      type: Boolean,
      defalt: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports.SudAkt = mongoose.model("sud_akt", schema);
