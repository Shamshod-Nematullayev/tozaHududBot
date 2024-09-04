const { default: mongoose } = require("mongoose");

const schema = new mongoose.Schema({
  asosiy_licshet: String,
  ikkilamchi_licshet: String,
  sana: Date,
  document_type: {
    type: String,
    enum: ["dvaynik", "odam_soni", "viza"],
    required: true,
  },
  document_number: {
    required: true,
    unique: true,
    type: Number,
  },
  licshet: {
    type: String,
    required: true,
  },
  comment: {
    type: String,
    default: "",
  },
  aktSummasi: {
    type: Number,
    default: 0,
  },
  current_prescribed_cnt: {
    type: Number,
  },
  next_prescribed_cnt: {
    type: Number,
  },
});
module.exports.Ariza = mongoose.model("ariza", schema, "arizalar");
