const { Schema, model } = require("mongoose");

const schema = new Schema({
  id: {
    type: Number,
    required: true,
  },
  inHabitantCount: {
    type: Number,
    required: true,
  },
  accountNumber: {
    type: String,
    required: true,
  },
  companyId: {
    type: Number,
    required: true,
  },
});

module.exports.FreeAbonent = model("free_abonent", schema);
