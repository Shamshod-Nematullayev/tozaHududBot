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
  cadastr: String,
  companyId: {
    type: Number,
    required: true,
  },
});

module.exports.FreeAbonent = model("free_abonent", schema);
