const { Schema, default: mongoose } = require("mongoose");

const schema = new Schema({
  licshet: {
    required: true,
    type: String,
  },
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
  isSavedBilling: { type: Boolean, default: false },
  warning_amount: Number,
  sud_process_id_billing: String,
  warning_date_billing: Date,
  sud_akt_id: {
    type: String,
    default: "",
  },
  abonent_deleted: { type: Boolean, default: false },
});

module.exports.HybridMail = mongoose.model("hybrid_mail", schema);
