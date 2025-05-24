const { Schema, model } = require("mongoose");

const logSchema = new Schema(
  {
    actions: String,
    user: String,
    date: Date,
    comment: String,
  },
  { _id: false }
);

const schema = new Schema({
  accountNumber: {
    type: String,
    required: true,
  },
  actPackId: {
    type: Number,
    required: true,
  },
  actId: {
    type: Number,
    required: true,
  },
  checkedAt: {
    type: Date,
    default: false,
  },
  checkedBy: String,
  fixedSum: Number,
  warningMessage: String,
  status: {
    type: String,
    enum: [
      "yangi",
      "ogohlantirildi",
      "tuzatildi",
      "bekor_qilindi",
      "tekshirildi",
    ],
    default: "yangi",
  },
  logs: {
    type: Array(logSchema),
    default: [],
  },
});

module.exports.Act = model("act", schema);
