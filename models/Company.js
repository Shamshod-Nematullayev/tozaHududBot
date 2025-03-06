const { Schema, model } = require("mongoose");

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
    active: Boolean,
  },
  {
    timestamps: true,
  }
);

module.exports.Company = model("Company", schema);
