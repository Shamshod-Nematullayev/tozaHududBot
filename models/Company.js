const { Schema, model } = require("mongoose");

const aktPackSchema = new Schema({
  id: {
    type: String,
    required: true,
  },
  month: {
    type: Number,
    required: true,
  },
  year: {
    type: Number,
    required: true,
  },
});
const aktPackTypesSchema = new Schema({
  viza: aktPackSchema,
  odam_soni: aktPackSchema,
  dvaynik: aktPackSchema,
  pul_kuchirish: aktPackSchema,
  death: aktPackSchema,
  gps: aktPackSchema,
});
const schema = new Schema(
  {
    user_id: Number,
    login: String,
    password: String,
    authorization: String,
    hybridToken: String,
    hybridLogin: String,
    hybridPassword: String,
    ekopayLogin: String,
    ekopayPassword: String,
    ekopaySessionId: String,
    ekopayToken: String,
    type: {
      type: String,
      enum: ["dxsh", "ekopay"],
      default: "dxsh",
    },
    path: {
      type: Object,
      default: {
        getIncomes: "",
        createNewAbonent: "",
        searchAbonent: "",
      },
    },
    akt_pachka_ids: aktPackTypesSchema,
    active: Boolean,
    akt_pachka_id: {
      type: Object,
      default: {
        death: "", //o'lim haqidagi guvohnomalar
        viza: "", // horijga chiqish vizasi bo'yicha
        odam_soni: "",
        pul_kuchirish: "",
        dvaynik: "", // ikkilamchi kodlarni o'chirish bo'yicha
        gps: "", // moshin bormagan davrni akt qilish bo'yicha
        boshqa: "",
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports.Company = model("Company", schema);
