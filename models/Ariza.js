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
});
module.exports.Ariza = mongoose.model("ariza", schema, "arizalar");
