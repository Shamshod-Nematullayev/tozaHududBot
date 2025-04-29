const { Schema, model } = require("mongoose");

const citizenSchema = new Schema({
  pnfl: {
    type: String,
    required: true,
  },
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  patronymic: String,
  passport: String,
  photo: String,
  birthDate: String,
  passportGivenDate: String,
  passportIssuer: String,
  passportExpireDate: String,
});

const schema = new Schema({
  citizen: citizenSchema,
  nazoratchi_id: String,
  mahalla_id: String,
  abonent_name: String,
  licshet: String,
});

module.exports.NewAbonent = model("new_abonent", schema);
