const { default: mongoose } = require("mongoose");

const schema = mongoose.Schema(
  {
    kod: {
      type: Number,
      required: true,
    },
    fish: String,
    bildirish_xat: {
      type: Object,
      default: { raqami: null, link: "" },
    },
    ogohlantirish_xati: {
      type: Boolean,
      default: false,
    },
    forma_bir: {
      type: Object,
      default: { topildi: false },
    },
    solishtirma_dalolatnoma: {
      type: Number,
      default: null,
    },
    viloyatga_yuborildi: {
      type: Object,
      default: {
        yuborildi: false,
      },
    },
    sud_buyrugi: {
      type: Object,
      default: {
        chiqdi: false,
      },
    },
    aktiv: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      default: "YANGI",
    },
    pachka_id: String,
    qarzdorlik: Number,
  },
  {
    timestamps: true,
  }
);

module.exports.SudAkt = mongoose.model("sud_akt", schema);
