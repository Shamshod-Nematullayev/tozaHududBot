const { Schema, model } = require("mongoose");

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
    saldo_n: Number,
    saldo_k: Number,
    energy_licshet: Number,
    kadastr_number: String,
    last_pay_date: String,
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
    prescribed_cnt: Number,
    shaxsi_tasdiqlandi: {
      type: Object,
      default: {
        confirm: false,
      },
    },
    ekt_kod_tasdiqlandi: {
      type: Object,
      default: {
        confirm: false,
      },
    },
    street_tasdiqlandi: {
      type: Object,
      default: {
        confirm: false,
      },
    },
    bumadi: Boolean,
  },
  {
    timestamps: true,
  }
);

const Abonent = model("billing_abonent", schema);
module.exports = { Abonent };
