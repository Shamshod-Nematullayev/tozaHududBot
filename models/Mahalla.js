const { default: mongoose } = require("mongoose");

const schema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  reja: {
    type: Number,
  },
  biriktirilganNazoratchi: Object,
  groups: {
    type: Array,
    default: [],
  },
  ommaviy_shartnoma: Object,
  sektor: String,
  mfy_rais_name: String,
  mfy_rais_phone: String,
  hokim_yordamchi_name: String,
  hokim_yordamchi_phone: String,
  yoshlar_yetakchi_name: String,
  yoshlar_yetakchi_phone: String,
  xotinqizlar_name: String,
  xotinqizlar_phone: String,
  uchastkavoy_name: String,
  uchastkavoy_phone: String,
  shaxsi_tasdiqlandi_reja: Number,
  abarotka_berildi: {
    type: Boolean,
    default: false,
  },
  publicOfferFileId: String,
  companyId: {
    type: Number,
    required: true,
  },
});

module.exports.Mahalla = mongoose.model("mahalla", schema);
