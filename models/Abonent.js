const { Schema, model } = require("mongoose");

const inspectorSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  _id: {
    type: String,
    required: true,
  },
});
const isConfirmSchema = new Schema({
  confirm: {
    type: Boolean,
    default: false,
  },
  inspector_id: Number,
  inspector_name: String,
  inspector: inspectorSchema,
});
const schema = new Schema(
  {
    id: {
      type: Number,
      required: true,
    },
    fio: {
      type: String,
      required: true,
    },
    last_name: {
      type: String,
    },
    first_name: {
      type: String,
    },
    middle_name: {
      type: String,
    },
    licshet: {
      type: String,
      max: 12,
      min: 12,
    },
    energy_licshet: Number,
    kadastr_number: String,
    mahalla_name: String,
    mahallas_id: {
      type: Number,
      required: true,
    },
    streets_id: {
      type: Number,
    },
    streets_name: {
      type: String,
    },
    phone: String,
    pinfl: Number,
    passport_number: String,
    shaxsi_tasdiqlandi: isConfirmSchema,
    shaxsi_tasdiqlandi_history: {
      type: Array,
      default: [],
    },
    ekt_kod_tasdiqlandi: isConfirmSchema,
    street_tasdiqlandi: isConfirmSchema,
    bumadi: Boolean,
    companyId: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Abonent = model("billing_abonent", schema);
module.exports = { Abonent };
