const { Schema, default: mongoose } = require("mongoose");

const schema = new Schema({
  licshet: String,
  hybridMailId: {
    required: true,
    type: String,
    unique: true,
  },
  createdOn: Date,
  isCharged: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
  isSent: { type: Boolean, default: false },
  receiver: String,
  sentOn: Date,
  type: String,
});

module.exports.HybridMail = mongoose.model("hybrid_mail", schema);
