const { Schema, model } = require("mongoose");

const schema = new Schema(
  {
    user_id: Number,
    cookie: String,
    login: String,
    password: String,
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

module.exports.CleanCitySession = model("cleancitysession", schema);
