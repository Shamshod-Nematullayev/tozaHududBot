const { default: mongoose } = require("mongoose");

const schema = new mongoose.Schema(
  {
    elements: {
      type: Array,
      default: [],
    },
  },
  { timestamps: true }
);
module.exports.EnterWarningLettersModel = mongoose.model(
  "entering_warning_letters_pack",
  schema
);
